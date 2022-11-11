import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
import OnoffModel from '../models/OnoffModel.js';

dotenv.config();

const url = process.env.URL || 'https://onoff.vn/';

class OnoffController {
    // [GET] /api/:slug
    async getAllProductInPage(req, res) {
        const { p } = req.query;
        const _p = p ? p : 1;
        const slug = req.params.slug;
        const productList = await OnoffModel.getAllProductInPage({
            url,
            reqParams: slug,
            res,
            page: _p,
        });
        const { endPage } = await OnoffModel.getEndPage({
            url,
            reqParams: slug,
        });
        // const {totalProduct} = await OnoffModel.getTotalProduct({url, reqParams: slug, endPage})

        res.status(200).json({ currentPage: _p, endPage, productList });
    }

    // [GET] /api/:slug/:id
    async getDetailProduct(req, res) {
        const slugId = req.params.id;
        const detailList = await OnoffModel.getDetailList({
            url,
            reqParams: slugId,
        });

        res.status(200).json({
            detailList: detailList,
        });
    }
}

export default OnoffController;
