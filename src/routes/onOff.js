import OnoffController from '../app/controllers/OnoffControllers.js';
import express from 'express';

const router = express.Router();
const onoffController = new OnoffController();

router.get('/:slug', onoffController.getAllProductInPage);
router.get('/:slug/:id', onoffController.getDetailProduct);

export default router;
