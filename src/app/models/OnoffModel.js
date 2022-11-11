import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 5000;
const localUrl = `http://localhost:${port}`;

const OnoffModel = {
    async getEndPage({ url, reqParams }) {
        const maxPage = 10;
        const firstPage = 1;
        let promises = [];
        let isEndPage;
        let endPage;

        for (let i = firstPage; i < maxPage; i++) {
            promises.push(
                axios(url + reqParams, {
                    params: { p: i },
                }).then((response) => {
                    const html = response.data;
                    const $ = cheerio.load(html);

                    $(
                        '#wrapper-product-list > .toolbar-products > .pages > ul',
                    ).each(function () {
                        const classOfLastLi = $(this)
                            .find('li.item')
                            .last()
                            .attr('class');

                        isEndPage = classOfLastLi === 'item current';

                        if (isEndPage) {
                            endPage = i;
                            return;
                        }
                    });
                }),
            );

            if (isEndPage) return;
        }

        // Promise.all(promises).then(() => res.status(200).json({ endPage }));
        return await Promise.all(promises).then(() => ({
            endPage,
        }));
    },

    async getTotalProduct({ url, reqParams, endPage }) {
        const PRODUCT_EACH_PAGE = 24;
        let totalProduct = PRODUCT_EACH_PAGE * (endPage - 1);
        let productLengthLastPage;

        await axios(url + reqParams, {
            params: {
                p: endPage,
            },
        }).then((response) => {
            const html = response.data;
            const $ = cheerio.load(html);

            productLengthLastPage = $('.product-items', html).find(
                'li.product-item',
            ).length;
        });

        return { totalProduct: totalProduct + productLengthLastPage };
    },

    async getAllProductInPage({ url, reqParams, page }) {
        const productList = [];

        await axios(url + reqParams, {
            params: {
                p: page,
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
                        const link = $(this)
                            .find('.product-item-info > a')
                            ?.attr('href');
                        const label = $(this)
                            .find('.product-item-info > a > span > div > span')
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

                        productList.push({
                            link: `${localUrl}/api/${reqParams}/${link
                                .split('/')
                                .slice(-1)}`,
                            image,
                            label,
                            name,
                            oldPrice,
                            normalPrice,
                        });
                    });
            });
        });
        return productList;
    },

    async getDetailList({ url, reqParams }) {
        const detailList = {}

        await axios(url + reqParams).then((response) => {
            const html = response.data;
            const $ = cheerio.load(html);

            detailList.name = $('.product-info-main', html).find('div:first-child > h1 > span').text();
            detailList.sold = $('.product-info-main', html).find('div:nth-child(2) > .sold').text();
            detailList["SKU#"] = $('.product-info-main', html).find('div:nth-child(2) > div:nth-child(2)').find('.value').text();
            detailList.oldPrice = $('.old-price', html).find('.price').first().text();
            detailList.normalPrice = $('.normal-price', html).find('.price').first().text();
            detailList.image = $('.product.media', html).find('img').attr('src') || ""
        });

        return detailList
    },
};

export default OnoffModel;
