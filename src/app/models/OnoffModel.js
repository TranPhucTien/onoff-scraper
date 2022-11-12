import axios from 'axios';
import puppeteer from 'puppeteer';
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
                })
                    .then((response) => {
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
                    })
                    .catch((error) => {
                        endPage = null;
                        console.log(error);
                    }),
            );

            if (isEndPage) return;
        }

        return await Promise.all(promises).then(() => ({
            endPage: endPage ? endPage : null,
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

    async getThumbListProduct({
        url,
        reqParams,
        _page,
        category,
        color,
        size,
        materials,
        product_list_order,
    }) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`${url}/${reqParams}`);

        const thumbnailList = await page.evaluate(() => {
            let detailListDom = document.querySelectorAll(
                '.product-item-details',
            );
            detailListDom = [...detailListDom];

            let thumbnailList = detailListDom.map((thumbnail) => {
                const childThumb = [];

                thumbnail
                    .querySelectorAll('.swatch-option.image')
                    .forEach((option) => {
                        childThumb.push({
                            thumb: option
                                .querySelector('img')
                                ?.getAttribute('src'),
                            id: option?.getAttribute('option-label'),
                        });
                    });

                return childThumb;
            });

            return thumbnailList;
        });

        await page.close();
        return thumbnailList;
    },

    async getAllProductInPage({
        url,
        reqParams,
        page,
        category,
        color,
        size,
        materials,
        product_list_order,
    }) {
        const productList = [];

        try {
            await axios(url + reqParams, {
                params: {
                    p: page,
                    cat: category,
                    mastercolor: color,
                    size,
                    materials,
                    product_list_order,
                },
            }).then((response) => {
                const html = response.data;
                const $ = cheerio.load(html);

                $('.product-items', html).each(function () {
                    $(this)
                        .find('li.product-item')
                        .each(function () {
                            const image = $(this)
                                .find('.product-item-info')
                                .find('.product-image-wrapper.front > img')
                                .attr('data-src');
                            const imageHover = $(this)
                                .find('.product-item-info')
                                .find('.product-image-wrapper.back > img')
                                .attr('data-src');
                            const link = $(this)
                                .find('.product-item-info > a')
                                ?.attr('href');
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

                            const slugId = link.split('/').slice(-1);

                            productList.push({
                                link: `${localUrl}/api/detail/${slugId}`,
                                image: image ? image : '',
                                imageHover: imageHover ? imageHover : '',
                                label: label ? label : '',
                                name: name ? name : '',
                                oldPrice: oldPrice ? oldPrice : '',
                                normalPrice: normalPrice ? normalPrice : '',
                            });
                        });
                });
            });

            const thumbList = await this.getThumbListProduct({url, reqParams})

            for (let i = 0; i < productList.length; i++) {
                productList[i] = {...productList[i], thumbList: thumbList[i]}
            }

            return productList;
        } catch (error) {
            console.log(error);
            return { success: false };
        }
    },

    async getDetailList({ url, reqParams }) {
        const detailList = [];
        const detail = {};

        try {
            await axios(url + reqParams).then((response) => {
                const html = response.data;
                const $ = cheerio.load(html);

                const breakCrumb = [];
                $(
                    '.breadcrumbs > .items > li:not(:last-child, :first-child)',
                    html,
                ).each(function () {
                    const text = $(this).find('a').text().trim() || '';
                    const slugName =
                        $(this)
                            .find('a')
                            .attr('href')
                            ?.split('/')
                            .slice(-1)
                            .join('') || '';
                    breakCrumb.push({
                        text,
                        slug: `${slugName}`,
                    });
                });

                const name = $('.product-info-main', html)
                    .find('div:first-child > h1 > span')
                    .text();

                const sold = $('.product-info-main', html)
                    .find('div:nth-child(2) > .sold')
                    .text();

                const sku = $('.product-info-main', html)
                    .find('div:nth-child(2) > div:nth-child(2)')
                    .find('.value')
                    .text();

                const oldPrice = $('.old-price', html)
                    .find('.price')
                    .first()
                    .text();

                const normalPrice = $('.normal-price', html)
                    .find('.price')
                    .first()
                    .text();

                const image = $('.product.media', html).find('img').attr('src');

                const sizeChart = {};
                sizeChart.mobile =
                    $('.sizechart > img.size-mobile', html).attr('src') || '';
                sizeChart.desctop =
                    $('.sizechart > img.size-desktop', html).attr('src') || '';

                const featureList = [];
                $('.feature > div > div', html).each(function () {
                    const icon = $(this).find('img').attr('src') || '';
                    const title = $(this).find('h3').text() || '';
                    const desc = $(this).find('p').text() || '';

                    featureList.push({ icon, title, desc });
                });

                const materialList = [];
                $('.material > div', html).each(function () {
                    const per = $(this).find('p').first().text() || '';
                    const name = $(this).find('p').last().text() || '';
                    materialList.push({ per, name });
                });

                let content = [];
                $(
                    '.description > div > div.pagebuilder-column:first-child > h2',
                    html,
                ).each(function () {
                    const title = $(this).text() || '';
                    content.push({ title });
                });

                $(
                    '.description > div > div.pagebuilder-column:first-child > div',
                    html,
                ).each(function (i) {
                    const desc = $(this).find('p').text() || '';
                    const listDesc = [];

                    $(this)
                        .find('ul > li')
                        .each(function () {
                            const item = $(this).text() || '';
                            listDesc.push(item);
                        });
                    content[i] = { ...content[i], desc, listDesc };
                });

                const productRelative = [];
                $('.product-items > div', html).each(function () {
                    const image = $(this).find('img').attr('data-src') || '';
                    const name =
                        $(this).find('.product-item-name > a').text() || '';
                    const normalPrice =
                        $(this).find('.normal-price').find('.price').text() ||
                        '';
                    const oldPrice =
                        $(this).find('.old-price').find('.price').text() || '';
                    const label =
                        $(this).find('.product-label > span').text() || '';
                    const slugId =
                        $(this)
                            .find('a')
                            .first()
                            .attr('href')
                            .split('/')
                            .slice(-1)
                            .join('') || '';

                    productRelative.push({
                        image,
                        name,
                        normalPrice,
                        oldPrice,
                        label,
                        slugId,
                    });
                });

                detailList.push({
                    breakCrumb,
                    name,
                    sold,
                    sku,
                    oldPrice,
                    normalPrice,
                    image,
                    sizeChart,
                    featureList,
                    materialList,
                    content,
                    productRelative,
                });
            });

            for (const property in detailList[0]) {
                detail[property] = detailList[0][property] || '';
            }

            return detail;
        } catch (error) {
            console.log(error);
            return { success: false };
        }
    },
};

export default OnoffModel;
