import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

const vehicleInclude = {
  _count: { select: { trips: true, fuelRecords: true, serviceRecords: true } },
};

export async function listVehicles(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      where.OR = [
        { regNumber: { contains: req.query.q, mode: "insensitive" } },
        { make: { contains: req.query.q, mode: "insensitive" } },
        { model: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const data = await prisma.vehicle.findMany({
      where,
      include: vehicleInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createVehicle(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const regNumber = String(body.regNumber || "").trim().toUpperCase();
    if (!regNumber) throw buildError(400, "regNumber is required");

    const data = await prisma.vehicle.create({
      data: {
        workspaceId,
        regNumber,
        type: body.type || "truck",
        make: body.make || null,
        model: body.model || null,
        year: body.year ? Number(body.year) : null,
        capacityKg: body.capacityKg ?? null,
        fuelType: body.fuelType || "diesel",
        odometerKm: body.odometerKm ? Number(body.odometerKm) : 0,
        status: body.status || "idle",
      },
      include: vehicleInclude,
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function getVehicle(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const vehicle = await ensureOwned("vehicle", req.params.id, workspaceId, "Vehicle");
    const data = await prisma.vehicle.findUnique({
      where: { id: vehicle.id },
      include: {
        ...vehicleInclude,
        fuelRecords: {
          orderBy: { recordedAt: "desc" },
          take: 20,
          include: { trip: { select: { id: true, origin: true, destination: true } } },
        },
        serviceRecords: {
          orderBy: { startDate: "desc" },
          include: { serviceType: true },
        },
        maintenancePlans: { include: { serviceType: true } },
        trips: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { driver: true },
        },
      },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const vehicle = await ensureOwned("vehicle", req.params.id, workspaceId, "Vehicle");
    const body = req.body || {};

    const data = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        ...(body.regNumber !== undefined && {
          regNumber: String(body.regNumber).trim().toUpperCase(),
        }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.make !== undefined && { make: body.make }),
        ...(body.model !== undefined && { model: body.model }),
        ...(body.year !== undefined && { year: body.year ? Number(body.year) : null }),
        ...(body.capacityKg !== undefined && { capacityKg: body.capacityKg }),
        ...(body.fuelType !== undefined && { fuelType: body.fuelType }),
        ...(body.odometerKm !== undefined && { odometerKm: Number(body.odometerKm) }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: vehicleInclude,
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const vehicle = await ensureOwned("vehicle", req.params.id, workspaceId, "Vehicle");
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}

/** POST /vehicles/:id/fuel — log a fuel fill-up; advances the odometer. */
export async function addFuelRecord(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const vehicle = await ensureOwned("vehicle", req.params.id, workspaceId, "Vehicle");
    const body = req.body || {};

    const liters = Number(body.liters);
    const amount = Number(body.amount);
    if (!liters || liters <= 0) throw buildError(400, "liters must be a positive number");
    if (!amount || amount <= 0) throw buildError(400, "amount must be a positive number");

    if (body.tripId) {
      const trip = await ensureOwned("trip", body.tripId, workspaceId, "Trip");
      if (trip.vehicleId !== vehicle.id) throw buildError(400, "Trip does not belong to this vehicle");
    }

    const odometerKm = body.odometerKm != null ? Number(body.odometerKm) : null;
    if (odometerKm != null && odometerKm < vehicle.odometerKm) {
      throw buildError(400, "odometerKm cannot be lower than the vehicle's current odometer");
    }

    const data = await prisma.$transaction(async (tx) => {
      const record = await tx.fuelRecord.create({
        data: {
          workspaceId,
          vehicleId: vehicle.id,
          tripId: body.tripId || null,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
          liters,
          amount,
          odometerKm,
          station: body.station || null,
        },
      });
      if (odometerKm != null && odometerKm > vehicle.odometerKm) {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { odometerKm },
        });
      }
      return record;
    });

    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

/**
 * POST /vehicles/:id/services — record a maintenance job, resolve the service
 * type by name (create-on-demand) and advance the vehicle's maintenance plan.
 */
export async function addServiceRecord(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const vehicle = await ensureOwned("vehicle", req.params.id, workspaceId, "Vehicle");
    const body = req.body || {};

    const serviceTypeName = String(body.serviceTypeName || body.serviceType || "").trim();
    if (!serviceTypeName) throw buildError(400, "serviceTypeName is required");
    if (!body.startDate) throw buildError(400, "startDate is required");

    const startDate = new Date(body.startDate);
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const intervalDays = body.intervalDays != null ? Number(body.intervalDays) : null;
    const intervalKm = body.intervalKm != null ? Number(body.intervalKm) : null;
    const odometerKm = body.odometerKm != null ? Number(body.odometerKm) : null;

    const dueDate = endDate || startDate;
    const nextDueDate = intervalDays ? new Date(dueDate.getTime() + intervalDays * 86400000) : null;
    const nextDueKm =
      intervalKm && odometerKm != null ? odometerKm + intervalKm : null;

    const data = await prisma.$transaction(async (tx) => {
      const serviceType = await tx.serviceType.upsert({
        where: { workspaceId_name: { workspaceId, name: serviceTypeName } },
        create: { workspaceId, name: serviceTypeName, intervalDays, intervalKm },
        update: {
          ...(intervalDays != null && { intervalDays }),
          ...(intervalKm != null && { intervalKm }),
        },
      });

      const record = await tx.serviceRecord.create({
        data: {
          workspaceId,
          vehicleId: vehicle.id,
          serviceTypeId: serviceType.id,
          startDate,
          endDate,
          status: body.status || "completed",
          cost: body.cost ?? 0,
          odometerKm,
          notes: body.notes || null,
        },
        include: { serviceType: true },
      });

      await tx.maintenancePlan.upsert({
        where: {
          vehicleId_serviceTypeId: {
            vehicleId: vehicle.id,
            serviceTypeId: serviceType.id,
          },
        },
        create: {
          workspaceId,
          vehicleId: vehicle.id,
          serviceTypeId: serviceType.id,
          lastDoneAt: dueDate,
          nextDueDate,
          nextDueKm,
        },
        update: {
          lastDoneAt: dueDate,
          nextDueDate,
          nextDueKm,
        },
      });

      if (odometerKm != null && odometerKm > vehicle.odometerKm) {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { odometerKm },
        });
      }

      return record;
    });

    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}
