import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

function normalizeStops(stops) {
  if (!Array.isArray(stops)) return [];
  return stops
    .map((stop, index) => ({
      name: String(stop.name || "").trim(),
      city: stop.city || null,
      position: stop.position ?? index,
      stopType: stop.stopType || "delivery",
    }))
    .filter((stop) => stop.name)
    .map((stop, index) => ({ ...stop, position: stop.position ?? index }));
}

export async function listRoutes(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      where.OR = [
        { name: { contains: req.query.q, mode: "insensitive" } },
        { originCity: { contains: req.query.q, mode: "insensitive" } },
        { destinationCity: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const data = await prisma.route.findMany({
      where,
      include: {
        stops: { orderBy: { position: "asc" } },
        _count: { select: { trips: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createRoute(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) throw buildError(400, "name is required");

    const stops = normalizeStops(body.stops);

    const data = await prisma.route.create({
      data: {
        workspaceId,
        name,
        originCity: body.originCity || null,
        destinationCity: body.destinationCity || null,
        distanceKm: body.distanceKm != null ? Number(body.distanceKm) : null,
        estimatedMinutes: body.estimatedMinutes != null ? Number(body.estimatedMinutes) : null,
        status: body.status || "active",
        ...(stops.length && { stops: { create: stops } }),
      },
      include: {
        stops: { orderBy: { position: "asc" } },
        _count: { select: { trips: true } },
      },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function getRoute(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const route = await ensureOwned("route", req.params.id, workspaceId, "Route");
    const data = await prisma.route.findUnique({
      where: { id: route.id },
      include: {
        stops: { orderBy: { position: "asc" } },
        trips: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { driver: true, vehicle: true },
        },
      },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateRoute(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const route = await ensureOwned("route", req.params.id, workspaceId, "Route");
    const body = req.body || {};

    const data = await prisma.$transaction(async (tx) => {
      await tx.route.update({
        where: { id: route.id },
        data: {
          ...(body.name !== undefined && { name: String(body.name).trim() }),
          ...(body.originCity !== undefined && { originCity: body.originCity }),
          ...(body.destinationCity !== undefined && { destinationCity: body.destinationCity }),
          ...(body.distanceKm !== undefined && {
            distanceKm: body.distanceKm != null ? Number(body.distanceKm) : null,
          }),
          ...(body.estimatedMinutes !== undefined && {
            estimatedMinutes: body.estimatedMinutes != null ? Number(body.estimatedMinutes) : null,
          }),
          ...(body.status !== undefined && { status: body.status }),
        },
      });

      if (Array.isArray(body.stops)) {
        const stops = normalizeStops(body.stops);
        await tx.routeStop.deleteMany({ where: { routeId: route.id } });
        if (stops.length) {
          await tx.routeStop.createMany({
            data: stops.map((stop) => ({ ...stop, routeId: route.id })),
          });
        }
      }

      return tx.route.findUnique({
        where: { id: route.id },
        include: { stops: { orderBy: { position: "asc" } } },
      });
    });

    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteRoute(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const route = await ensureOwned("route", req.params.id, workspaceId, "Route");
    await prisma.route.delete({ where: { id: route.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}
