import OnoffController from '../app/controllers/OnoffControllers.js';
import express from 'express';

const router = express.Router();
const onoffController = new OnoffController();

router.get('/nodeHtmlParse', onoffController.nodeHtmlParse);
router.get('/detail/:slugId', onoffController.getDetailProduct);
router.get('/:slugName', onoffController.getAllProductInPage);

export default router;
