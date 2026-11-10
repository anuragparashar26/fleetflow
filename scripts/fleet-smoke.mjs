/**
 * Fleet module smoke test — exercises every fleet controller against a real
 * PostgreSQL database without needing HTTP/Clerk (controllers are called with
 * mock req/res objects after resolving workspace context directly).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/fleet-smoke.mjs
 *
 * The DATABASE_URL must point at a DB where packages/db migrations are applied.
 */
import { loadEnv } from "../apps/api/src/utils/loadEnv.js";

loadEnv(); // load apps/api/.env first (it overrides env vars) ...
if (!process.env.SMOKE_DATABASE_URL) {
  console.error("Set SMOKE_DATABASE_URL to the scratch database URL");
  process.exit(1);
}
process.env.DATABASE_URL = process.env.SMOKE_DATABASE_URL; // ... then force scratch DB

const { prisma } = await import("../packages/db/index.js");
const utils = await import("../apps/api/src/modules/fleet/utils.js");
const shipments = await import("../apps/api/src/modules/fleet/controllers/shipment.controller.js");
const boards = await import("../apps/api/src/modules/fleet/controllers/board.controller.js");
const shippers = await import("../apps/api/src/modules/fleet/controllers/shipper.controller.js");
const vehicles = await import("../apps/api/src/modules/fleet/controllers/vehicle.controller.js");
const drivers = await import("../apps/api/src/modules/fleet/controllers/driver.controller.js");
const routes = await import("../apps/api/src/modules/fleet/controllers/route.controller.js");
const trips = await import("../apps/api/src/modules/fleet/controllers/trip.controller.js");
const activities = await import("../apps/api/src/modules/fleet/controllers/activity.controller.js");
const payouts = await import("../apps/api/src/modules/fleet/controllers/payout.controller.js");
const fleetRoutes = (await import("../apps/api/src/modules/fleet/routes/fleet.routes.js")).default;

let passed = 0;
let failed = 0;

function mockRes() {
  return {
    code: 200,
    payload: undefined,
    ended: false,
    status(c) { this.code = c; return this; },
    json(d) { this.payload = d; return this; },
    end() { this.ended = true; return this; },
  };
}

async function call(handler, req) {
  const res = mockRes();
  let error = null;
  await handler({ ...req }, res, (err) => { error = err; });
  return { res, error };
}

function expect(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name} ${detail}`);
  }
}

// ── Seed identity/workspace ──────────────────────────────────────────────────
const suffix = Date.now().toString(36);
const CLERK_ID = `smoke_owner_${suffix}`;

await prisma.profile.create({ data: { clerkUserId: CLERK_ID, email: "smoke@example.com", fullName: "Smoke Owner" } });
const workspace = await prisma.workspace.create({
  data: { name: `Smoke Workspace ${suffix}`, slug: `smoke-${suffix}` },
});
await prisma.workspaceMember.create({
  data: { workspaceId: workspace.id, userId: CLERK_ID, role: "owner" },
});

const base = { user: { id: CLERK_ID }, headers: {}, query: {}, body: {} };
const ctx = async (extra = {}) => {
  const req = { ...base, ...extra, query: { ...base.query, ...(extra.query || {}) } };
  await utils.fleetContext(req, mockRes(), () => {});
  return req;
};

console.log("\n— fleetContext & RBAC —");
{
  const req = await ctx();
  expect("fleetContext resolves workspace + role", req.fleet?.workspaceId === workspace.id && req.fleet?.role === "owner");

  const viewerReq = await ctx();
  viewerReq.fleet.role = "viewer";
  const guard = utils.requireRoles(...utils.MANAGER_ROLES);
  let guardErr = null;
  guard(viewerReq, mockRes(), (e) => { guardErr = e; });
  expect("manager guard rejects viewer", guardErr?.status === 403, `got ${guardErr?.status}`);

  const strangerReq = { user: { id: `stranger_${suffix}` }, headers: { "x-workspace-id": workspace.id }, query: {}, body: {} };
  let ctxErr = null;
  await utils.fleetContext(strangerReq, mockRes(), (e) => { ctxErr = e; });
  expect("non-member denied for workspace", ctxErr?.status === 403, `got ${ctxErr?.status}`);
}

console.log("\n— boards (nested columns) —");
let board, column;
{
  const { res, error } = await call(boards.createBoard, await ctx({ body: { name: "Smoke Board" } }));
  board = res.payload?.data;
  expect("createBoard 201 with default columns", !error && res.code === 201 && board?.columns?.length === 5);
  column = board?.columns?.[0];

  const update = await call(boards.updateBoard, await ctx({
    body: { columns: board.columns.map((c, i) => ({ ...c, name: `Stage ${i}` })) },
    params: { id: board.id },
  }));
  expect("updateBoard nested columns", !update.error && update.res.payload?.data?.columns?.[0]?.name === "Stage 0");
}

console.log("\n— shipments (nested writes, move, comments) —");
let shipment;
{
  const { res, error } = await call(shipments.createShipment, await ctx({
    body: { title: "Smoke Shipment", origin: "Delhi", destination: "Mumbai", priority: "high", columnId: column.id },
  }));
  shipment = res.payload?.data;
  expect("createShipment 201 with trackingNo", !error && res.code === 201 && shipment?.trackingNo?.startsWith("TRK-"));

  const driver = await prisma.driver.create({
    data: { workspaceId: workspace.id, firstName: "Ravi", lastName: "Kumar" },
  });

  const upd = await call(shipments.updateShipment, await ctx({
    params: { id: shipment.id },
    body: {
      items: [{ description: "Electronics", quantity: 2 }],
      labelNames: ["fragile", "express"],
      driverIds: [driver.id],
    },
  }));
  const full = upd.res.payload?.data;
  expect("updateShipment nested items", !upd.error && full?.items?.length === 1, JSON.stringify(upd.error));
  expect("updateShipment nested labels (connectOrCreate)", full?.labels?.length === 2);
  expect("updateShipment nested drivers", full?.drivers?.[0]?.driver?.firstName === "Ravi");

  const move = await call(shipments.moveShipment, await ctx({
    params: { id: shipment.id },
    body: { columnId: board.columns[1].id },
  }));
  expect("moveShipment ok", !move.error && move.res.payload?.data?.columnId === board.columns[1].id, JSON.stringify(move.error));
  const history = await prisma.shipmentStatusHistory.count({ where: { shipmentId: shipment.id } });
  expect("moveShipment wrote status history", history === 1);

  const crossTenant = await call(shipments.getShipment, await ctx({ params: { id: "00000000-0000-0000-0000-000000000000" } }));
  expect("getShipment unknown id → 404", crossTenant.error?.status === 404);

  const comment = await call(shipments.addShipmentComment, await ctx({ params: { id: shipment.id }, body: { body: "On the way" } }));
  expect("addShipmentComment 201", !comment.error && comment.res.code === 201);

  const detail = await call(shipments.getShipment, await ctx({ params: { id: shipment.id } }));
  expect("getShipment returns comments + history", detail.res.payload?.data?.comments?.length === 1 && detail.res.payload?.data?.statusHistory?.length === 1);
}

console.log("\n— shippers / drivers —");
{
  const { res, error } = await call(shippers.createShipper, await ctx({ body: { name: "Acme Corp", city: "Pune" } }));
  expect("createShipper 201", !error && res.code === 201);

  const dup = await call(shippers.createShipper, await ctx({ body: { name: "Acme Corp" } }));
  expect("duplicate shipper name → 409", dup.error?.status === 409, `got ${dup.error?.status}`);

  const { res: d } = await call(drivers.createDriver, await ctx({ body: { firstName: "Suresh" } }));
  expect("createDriver 201", d.code === 201);
}

console.log("\n— vehicles (fuel + service plan) —");
let vehicle;
{
  const { res, error } = await call(vehicles.createVehicle, await ctx({ body: { regNumber: "DL01AB1234", type: "truck" } }));
  vehicle = res.payload?.data;
  expect("createVehicle 201", !error && res.code === 201);

  const fuel = await call(vehicles.addFuelRecord, await ctx({
    params: { id: vehicle.id },
    body: { liters: 40, amount: 3600, odometerKm: 1250, station: "HP Delhi" },
  }));
  expect("addFuelRecord 201", !fuel.error && fuel.res.code === 201, JSON.stringify(fuel.error));

  const svc = await call(vehicles.addServiceRecord, await ctx({
    params: { id: vehicle.id },
    body: { serviceTypeName: "Oil Change", startDate: "2026-11-01", cost: 2500, odometerKm: 1250, intervalDays: 90, intervalKm: 5000 },
  }));
  expect("addServiceRecord 201", !svc.error && svc.res.code === 201, JSON.stringify(svc.error));

  const plan = await prisma.maintenancePlan.findFirst({ where: { vehicleId: vehicle.id } });
  expect("maintenance plan upserted with next due", plan?.nextDueDate != null && plan?.nextDueKm === 6250);

  const veh = await call(vehicles.getVehicle, await ctx({ params: { id: vehicle.id } }));
  expect("getVehicle includes fuel/service/plan", veh.res.payload?.data?.fuelRecords?.length === 1 && veh.res.payload?.data?.maintenancePlans?.length === 1);

  const odo = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  expect("odometer advanced by fuel log", odo.odometerKm === 1250);
}

console.log("\n— routes (nested stops) & trips (status side effects) —");
{
  const route = await call(routes.createRoute, await ctx({
    body: { name: "Delhi–Jaipur", originCity: "Delhi", destinationCity: "Jaipur", stops: [{ name: "Gurugram Hub" }, { name: "Behror Stop", stopType: "pickup" }] },
  }));
  expect("createRoute with nested stops", !route.error && route.res.payload?.data?.stops?.length === 2);

  const drv = await prisma.driver.findFirst({ where: { workspaceId: workspace.id } });
  const trip = await call(trips.createTrip, await ctx({
    body: { origin: "Delhi", destination: "Mumbai", vehicleId: vehicle.id, driverId: drv.id },
  }));
  expect("createTrip 201", !trip.error && trip.res.code === 201, JSON.stringify(trip.error));

  const vAfter = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  const dAfter = await prisma.driver.findUnique({ where: { id: drv.id } });
  expect("fleet marked busy on trip create", vAfter.status === "assigned" && dAfter.status === "on_trip");

  const started = await call(trips.updateTrip, await ctx({ params: { id: trip.res.payload.data.id }, body: { status: "in_transit" } }));
  expect("trip start stamps startedAt", started.res.payload?.data?.startedAt != null);

  const done = await call(trips.updateTrip, await ctx({ params: { id: trip.res.payload.data.id }, body: { status: "completed" } }));
  const vDone = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  expect("trip complete frees fleet", done.res.payload?.data?.completedAt != null && vDone.status === "idle");
}

console.log("\n— activities & payouts —");
{
  const act = await call(activities.createActivity, await ctx({
    body: { type: "pickup", title: "Picked up cargo", vehicleId: vehicle.id },
  }));
  expect("createActivity 201", !act.error && act.res.code === 201);

  const drv = await prisma.driver.findFirst({ where: { workspaceId: workspace.id } });
  const payout = await call(payouts.createPayout, await ctx({
    body: { driverId: drv.id, periodStart: "2026-11-01", periodEnd: "2026-11-15", basePay: 20000, bonuses: 1500, deductions: 500 },
  }));
  expect("createPayout computes netPay", !payout.error && Number(payout.res.payload?.data?.netPay) === 21000, JSON.stringify(payout.error));

  const paid = await call(payouts.updatePayout, await ctx({ params: { id: payout.res.payload.data.id }, body: { status: "paid" } }));
  expect("payout paid stamps paidAt", paid.res.payload?.data?.paidAt != null);

  const revert = await call(payouts.updatePayout, await ctx({ params: { id: payout.res.payload.data.id }, body: { status: "draft" } }));
  expect("paid payout cannot revert", revert.error?.status === 400);
}

console.log("\n— dashboard & route table —");
{
  const dashReq = await ctx();
  const dashboardHandler = fleetRoutes.stack.find(
    (layer) => layer.route?.path === "/dashboard" && layer.route?.methods?.get,
  ).route.stack[0].handle;
  const { res, error } = await call(dashboardHandler, dashReq);
  const data = res.payload?.data;
  expect("dashboard aggregates counts", !error && data?.shipments?.total >= 1 && data?.vehicles?.byStatus?.length >= 1, JSON.stringify(error));
  expect("dashboard byColumn populated", data?.shipments?.byColumn?.length >= 1);

  const fleetRoutesCount = fleetRoutes.stack.filter((l) => l.route).length;
  expect("fleet router exposes exactly 45 routes", fleetRoutesCount === 45, `got ${fleetRoutesCount}`);
}

// ── cleanup ────────────────────────────────────────────────────────────────
await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => {});
await prisma.profile.delete({ where: { clerkUserId: CLERK_ID } }).catch(() => {});
await prisma.$disconnect();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
