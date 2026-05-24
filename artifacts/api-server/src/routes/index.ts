import { Router, type IRouter } from "express";
import healthRouter from "./health";
import businessLaunchRouter from "./ai/business-launch";
import campaignRouter from "./ai/campaign";
import conversationsRouter from "./ai/conversations";
import dashboardRouter from "./dashboard";
import trendingRouter from "./trending";
import historyRouter from "./history";
import realtimeRouter from "./realtime";

const router: IRouter = Router();

router.use(healthRouter);
router.use(businessLaunchRouter);
router.use(campaignRouter);
router.use(conversationsRouter);
router.use(dashboardRouter);
router.use(trendingRouter);
router.use(historyRouter);
router.use(realtimeRouter);

export default router;
