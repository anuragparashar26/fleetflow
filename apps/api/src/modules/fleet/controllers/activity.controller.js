import prisma from "../../../utils/prisma.js";
import { buildError, MANAGER_ROLES, ensureOwned, toApiError, workspaceOf } from "../utils.js";

export async function listActivities(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.type) where.type = req.query.type;
    if (req.query.shipment_id) where.shipmentId = req.query.shipment_id;
    if (req.query.trip_id) where.tripId = req.query.trip_id;
    if (req.query.vehicle_id) where.vehicleId = req.query.vehicle_id;
    if (req.query.driver_id) where.driverId = req.query.driver_id;
    if (req.query.shipper_id) where.shipperId = req.query.shipper_id;
    if (req.query.from || req.query.to) {
      where.occurredAt = {};
      if (req.query.from) where.occurredAt.gte = new Date(req.query.from);
      if (req.query.to) where.occurredAt.lte = new Date(req.query.to);
    }
    const data = await prisma.activity.findMany({
      where,
      include: {
        shipment: { select: { id: true, trackingNo: true, title: true } },
        trip: { select: { id: true, origin: true, destination: true } },
        vehicle: { select: { id: true, regNumber: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        shipper: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createActivity(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) throw buildError(400, "title is required");
    if (!body.type) throw buildError(400, "type is required");

    if (body.shipmentId) await ensureOwned("shipment", body.shipmentId, workspaceId, "Shipment");
    if (body.tripId) await ensureOwned("trip", body.tripId, workspaceId, "Trip");
    if (body.vehicleId) await ensureOwned("vehicle", body.vehicleId, workspaceId, "Vehicle");
    if (body.driverId) await ensureOwned("driver", body.driverId, workspaceId, "Driver");
    if (body.shipperId) await ensureOwned("shipper", body.shipperId, workspaceId, "Shipper");

    const data = await prisma.activity.create({
      data: {
        workspaceId,
        type: body.type,
        title,
        note: body.note || null,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        isCompleted: Boolean(body.isCompleted),
        createdBy: req.fleet.userId,
        shipmentId: body.shipmentId || null,
        tripId: body.tripId || null,
        vehicleId: body.vehicleId || null,
        driverId: body.driverId || null,
        shipperId: body.shipperId || null,
      },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteActivity(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const activity = await ensureOwned("activity", req.params.id, workspaceId, "Activity");
    // Members may remove their own log entries; any other case needs a manager.
    if (activity.createdBy !== req.fleet.userId && !MANAGER_ROLES.includes(req.fleet.role)) {
      throw buildError(403, "Access denied: insufficient workspace permissions");
    }
    await prisma.activity.delete({ where: { id: activity.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}
