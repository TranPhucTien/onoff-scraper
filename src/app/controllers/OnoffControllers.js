import dotenv from 'dotenv';
import OnoffModel from '../models/OnoffModel.js';

dotenv.config();

const url = process.env.URL || 'https://onoff.vn/';

class OnoffController {
    // [GET] /api/:slugName
    async getAllProductInPage(req, res) {
        const { p, cat, mastercolor, size, materials, product_list_order } =
            req.query;
        const currentPage = p ? p : 1;
        const _cat = cat !== 'undefined' ? cat : '';
        const _color = mastercolor !== 'undefined' ? mastercolor : '';
        const _size = size !== 'undefined' ? size : '';
        const _materials = materials !== 'undefined' ? materials : '';
        const _product_list_order =
            product_list_order !== 'undefined' ? product_list_order : '';
        const slug = req.params.slugName;

        const productList = await OnoffModel.getAllProductInPage({
            url,
            reqParams: slug,
            page: currentPage,
            category: _cat,
            color: _color,
            size: _size,
            materials: _materials,
            product_list_order: _product_list_order,
        });

        if (!productList) {
            return res.status(404).json({ success: false });
        }

        // const {totalProduct} = await OnoffModel.getTotalProduct({url, reqParams: slug, endPage})

        return res.status(200).json({ currentPage, productList });
    }

    // [GET] /api/detail/:slugId
    async getDetailProduct(req, res) {
        const slugId = req.params.slugId;

        const detailList = await OnoffModel.getDetailList({
            url,
            reqParams: slugId,
        });

        if (!detailList) {
            return res.status(404).json({ success: false });
        }
        return res.status(200).json({ ...detailList });
    }

    // [GET] /api/endPage/:slugName
    async getEndPage(req, res) {
        const { p, cat, mastercolor, size, materials, product_list_order } =
            req.query;
        const _cat = cat !== 'undefined' ? cat : '';
        const _color = mastercolor !== 'undefined' ? mastercolor : '';
        const _size = size !== 'undefined' ? size : '';
        const _materials = materials !== 'undefined' ? materials : '';
        const _product_list_order =
            product_list_order !== 'undefined' ? product_list_order : '';
        const slug = req.params.slugName;

        const endPage = await OnoffModel.getEndPage({
            url,
            reqParams: slug,
            category: _cat,
            color: _color,
            size: _size,
            materials: _materials,
            product_list_order: _product_list_order,
        });

        const _endPage = endPage ? endPage : null;
        console.log(
            '🚀 ~ file: OnoffControllers.js ~ line 84 ~ OnoffController ~ getEndPage ~ _endPage',
            _endPage,
        );

        if (_endPage) {
            res.status(200).json({ success: true, endPage: _endPage });
        } else {
            res.status(500).json({ success: false, endPage });
        }
    }
}

export default OnoffController;
