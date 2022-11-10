import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.URL || 'https://onoff.vn/';

class OnoffController {
    // [GET] /api/:type
    index(req, res) {
        const productList = [];
        let { p } = req.query;

        p = p ? p : 1;

        const type = req.params.type;

        try {
            axios(url + type, {
                params: {
                    p,
                },
            }).then((response) => {
                const html = response.data;
                const $ = cheerio.load(html);

                $('.product-items', html).each(function () {
                    $(this)
                        .find('li.product-item')
                        .each(function () {
                            const image = $(this)
                                .find(
                                    '.product-item-info > a > span > div:nth-child(2) > span > img',
                                )
                                .attr('data-src');
                            const label = $(this)
                                .find(
                                    '.product-item-info > a > span > div > span',
                                )
                                .text();
                            const itemDetailList = $(this).find(
                                '.product-item-details',
                            );
                            const name = itemDetailList.find('a').text();
                            const oldPrice = itemDetailList
                                .find(
                                    '.old-price > span > span:nth-child(2) > span',
                                )
                                .text();
                            const normalPrice = itemDetailList
                                .find(
                                    '.normal-price > span > span:nth-child(2) > span',
                                )
                                .text();

                            const swatchOptionList = [];

                            productList.push({
                                image,
                                label,
                                name,
                                oldPrice,
                                normalPrice,
                                swatchOptionList,
                            });
                        });
                });

                res.status(200).json({
                    productList,
                });
            });
        } catch (error) {}
    }
}

export default OnoffController;
