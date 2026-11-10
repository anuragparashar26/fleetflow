import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

export async function listDrivers(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      where.OR = [
        { firstName: { contains: req.query.q, mode: "insensitive" } },
        { lastName: { contains: req.query.q, mode: "insensitive" } },
        { employeeCode: { contains: req.query.q, mode: "insensitive" } },
        { licenseNumber: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const data = await prisma.driver.findMany({
      where,
      include: { _count: { select: { trips: true, assignedShipments: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createDriver(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const firstName = String(body.firstName || "").trim();
    if (!firstName) throw buildError(400, "firstName is required");

    const data = await prisma.driver.create({
      data: {
        workspaceId,
        userId: body.userId || null,
        employeeCode: body.employeeCode || null,
        firstName,
        lastName: body.lastName || null,
        email: body.email || null,
        phone: body.phone || null,
        licenseNumber: body.licenseNumber || null,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        status: body.status || "available",
      },
      include: { _count: { select: { trips: true, assignedShipments: true } } },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function getDriver(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const driver = await ensureOwned("driver", req.params.id, workspaceId, "Driver");
    const data = await prisma.driver.findUnique({
      where: { id: driver.id },
      include: {
        _count: { select: { trips: true, assignedShipments: true, payouts: true } },
        trips: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { vehicle: true },
        },
        payouts: { orderBy: { periodStart: "desc" }, take: 12 },
        assignedShipments: {
          take: 10,
          include: { shipment: { select: { id: true, trackingNo: true, title: true, column: true } } },
        },
      },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateDriver(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const driver = await ensureOwned("driver", req.params.id, workspaceId, "Driver");
    const body = req.body || {};

    const data = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ...(body.employeeCode !== undefined && { employeeCode: body.employeeCode }),
        ...(body.firstName !== undefined && { firstName: String(body.firstName).trim() }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber }),
        ...(body.licenseExpiry !== undefined && {
          licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.userId !== undefined && { userId: body.userId }),
      },
      include: { _count: { select: { trips: true, assignedShipments: true } } },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteDriver(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const driver = await ensureOwned("driver", req.params.id, workspaceId, "Driver");
    await prisma.driver.delete({ where: { id: driver.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}
