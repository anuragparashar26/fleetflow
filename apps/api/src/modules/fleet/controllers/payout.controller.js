import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

function computeNetPay(body) {
  const basePay = Number(body.basePay) || 0;
  const bonuses = Number(body.bonuses) || 0;
  const deductions = Number(body.deductions) || 0;
  if (basePay <= 0) throw buildError(400, "basePay must be a positive number");
  return { basePay, bonuses, deductions, netPay: basePay + bonuses - deductions };
}

export async function listPayouts(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.driver_id) where.driverId = req.query.driver_id;
    const data = await prisma.driverPayout.findMany({
      where,
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createPayout(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    if (!body.driverId) throw buildError(400, "driverId is required");
    if (!body.periodStart || !body.periodEnd) {
      throw buildError(400, "periodStart and periodEnd are required");
    }
    await ensureOwned("driver", body.driverId, workspaceId, "Driver");
    const { basePay, bonuses, deductions, netPay } = computeNetPay(body);

    const data = await prisma.driverPayout.create({
      data: {
        workspaceId,
        driverId: body.driverId,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        basePay,
        bonuses,
        deductions,
        netPay,
        status: "draft",
      },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updatePayout(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const payout = await ensureOwned("driverPayout", req.params.id, workspaceId, "DriverPayout");
    const body = req.body || {};

    if (payout.status === "paid" && body.status && body.status !== "paid") {
      throw buildError(400, "Paid payouts cannot be moved back to another status");
    }

    const recalc = ["basePay", "bonuses", "deductions"].some((key) => body[key] !== undefined)
      ? computeNetPay({
          basePay: body.basePay ?? payout.basePay,
          bonuses: body.bonuses ?? payout.bonuses,
          deductions: body.deductions ?? payout.deductions,
        })
      : null;

    const data = await prisma.driverPayout.update({
      where: { id: payout.id },
      data: {
        ...(body.periodStart !== undefined && { periodStart: new Date(body.periodStart) }),
        ...(body.periodEnd !== undefined && { periodEnd: new Date(body.periodEnd) }),
        ...(recalc && {
          basePay: recalc.basePay,
          bonuses: recalc.bonuses,
          deductions: recalc.deductions,
          netPay: recalc.netPay,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.status === "paid" && { paidAt: new Date() }),
      },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}
