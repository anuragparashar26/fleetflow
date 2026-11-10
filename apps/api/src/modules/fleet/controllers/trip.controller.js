import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

const tripInclude = {
  driver: true,
  vehicle: true,
  route: { select: { id: true, name: true } },
  _count: { select: { shipments: true, fuelRecords: true } },
};

export async function listTrips(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.driver_id) where.driverId = req.query.driver_id;
    if (req.query.vehicle_id) where.vehicleId = req.query.vehicle_id;
    if (req.query.q) {
      where.OR = [
        { origin: { contains: req.query.q, mode: "insensitive" } },
        { destination: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const data = await prisma.trip.findMany({
      where,
      include: tripInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createTrip(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const origin = String(body.origin || "").trim();
    const destination = String(body.destination || "").trim();
    if (!origin) throw buildError(400, "origin is required");
    if (!destination) throw buildError(400, "destination is required");
    if (!body.vehicleId) throw buildError(400, "vehicleId is required");
    if (!body.driverId) throw buildError(400, "driverId is required");

    const vehicle = await ensureOwned("vehicle", body.vehicleId, workspaceId, "Vehicle");
    const driver = await ensureOwned("driver", body.driverId, workspaceId, "Driver");
    if (body.routeId) await ensureOwned("route", body.routeId, workspaceId, "Route");

    const data = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          workspaceId,
          routeId: body.routeId || null,
          vehicleId: vehicle.id,
          driverId: driver.id,
          origin,
          destination,
          status: body.status || "planned",
          distanceKm: body.distanceKm != null ? Number(body.distanceKm) : null,
          notes: body.notes || null,
        },
        include: tripInclude,
      });
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: "assigned" },
      });
      await tx.driver.update({
        where: { id: driver.id },
        data: { status: "on_trip" },
      });
      return trip;
    });

    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateTrip(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const trip = await ensureOwned("trip", req.params.id, workspaceId, "Trip");
    const body = req.body || {};

    if (body.vehicleId) await ensureOwned("vehicle", body.vehicleId, workspaceId, "Vehicle");
    if (body.driverId) await ensureOwned("driver", body.driverId, workspaceId, "Driver");
    if (body.routeId) await ensureOwned("route", body.routeId, workspaceId, "Route");

    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          ...(body.origin !== undefined && { origin: String(body.origin).trim() }),
          ...(body.destination !== undefined && { destination: String(body.destination).trim() }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.routeId !== undefined && { routeId: body.routeId }),
          ...(body.vehicleId !== undefined && { vehicleId: body.vehicleId }),
          ...(body.driverId !== undefined && { driverId: body.driverId }),
          ...(body.distanceKm !== undefined && {
            distanceKm: body.distanceKm != null ? Number(body.distanceKm) : null,
          }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.startedAt !== undefined && {
            startedAt: body.startedAt ? new Date(body.startedAt) : null,
          }),
          ...(body.completedAt !== undefined && {
            completedAt: body.completedAt ? new Date(body.completedAt) : null,
          }),
        },
        include: tripInclude,
      });

      // Auto timestamps + fleet availability on status transitions
      if (body.status === "in_transit" && !updated.startedAt) {
        await tx.trip.update({ where: { id: trip.id }, data: { startedAt: new Date() } });
      }
      if (body.status === "completed") {
        if (!updated.completedAt) {
          await tx.trip.update({ where: { id: trip.id }, data: { completedAt: new Date() } });
        }
        await tx.vehicle.update({
          where: { id: updated.vehicleId },
          data: { status: "idle" },
        });
        await tx.driver.update({
          where: { id: updated.driverId },
          data: { status: "available" },
        });
      }
      if (body.status === "cancelled") {
        await tx.vehicle.update({
          where: { id: updated.vehicleId },
          data: { status: "idle" },
        });
        await tx.driver.update({
          where: { id: updated.driverId },
          data: { status: "available" },
        });
      }

      return tx.trip.findUnique({ where: { id: trip.id }, include: tripInclude });
    });

    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const trip = await ensureOwned("trip", req.params.id, workspaceId, "Trip");
    await prisma.trip.delete({ where: { id: trip.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}
