import OnoffController from '../app/controllers/OnoffControllers.js';
import express from 'express';

const router = express.Router();
const onoffController = new OnoffController();

router.get('/:slugName', onoffController.getAllProductInPage);
router.get('/:slugName/:slugId', onoffController.getDetailProduct);

export default router;
