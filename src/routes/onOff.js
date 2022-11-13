import OnoffController from '../app/controllers/OnoffControllers.js';
import express from 'express';

const router = express.Router();
const onoffController = new OnoffController();

router.get('/detail/hardData/:slugId', onoffController.getHardDataDetail);
router.get('/detail/:slugId', onoffController.getDetailProduct);
router.get('/endPage/:slugName', onoffController.getEndPage);
router.get('/:slugName', onoffController.getAllProductInPage);

export default router;
