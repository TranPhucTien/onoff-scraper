import axios from 'axios';
import dotenv from 'dotenv';
import { parse } from 'node-html-parser';
import puppeteer from 'puppeteer';

dotenv.config();

const port = process.env.PORT || 5000;
const localUrl = `http://localhost:${port}`;

const OnoffModel = {
    async getEndPage({
        url,
        reqParams,
        category,
        color,
        size,
        materials,
        product_list_order,
    }) {
        let firstPage = 1;
        const maxPage = 20;
        const promises = [];
        let isEndPage = false;
        let endPage;

        for (let i = firstPage; i < maxPage; i++) {
            promises.push(
                axios(url + reqParams, {
                    params: {
                        p: i,
                        cat: category,
                        mastercolor: color,
                        size,
                        materials,
                        product_list_order,
                    },
                })
                    .then((response) => {
                        const html = response.data;
                        const document = parse(html);

                        const hasPagination = document.querySelector(
                            '#wrapper-product-list > .toolbar-products > .pages',
                        );
                        if (!hasPagination) {
                            endPage = 1;
                            isEndPage = true;
                            return;
                        }

                        const classOfLastLi = document
                            .querySelector(
                                '#wrapper-product-list > .toolbar-products > .pages > ul > li:last-child',
                            )
                            ?.getAttribute('class');
                        isEndPage = classOfLastLi === 'item current';

                        if (isEndPage) {
                            endPage = i;
                            return;
                        }
                    })
                    .catch((error) => {
                        endPage = null;
                        console.log(error);
                    }),
            );

            if (isEndPage) break;
        }

        return await Promise.all(promises).then(() => endPage);
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
            const document = parse(html);

            productLengthLastPage = document
                .querySelector('.product-items')
                .querySelector('li.product-item').length;
        });

        return { totalProduct: totalProduct + productLengthLastPage };
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
        let lastPage = 1;

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
                const document = parse(html);

                document
                    .querySelectorAll('.product-items')
                    .forEach((listItem) => {
                        listItem
                            .querySelectorAll('li.product-item')
                            .forEach((item) => {
                                const infoItem =
                                    item.querySelector('.product-item-info');

                                const image = infoItem
                                    .querySelector(
                                        '.product-image-wrapper.front > img',
                                    )
                                    .getAttribute('data-src');

                                const imageHover = infoItem
                                    .querySelector(
                                        '.product-image-wrapper.back > img',
                                    )
                                    ?.getAttribute('data-src');

                                const link = infoItem
                                    .querySelector('a')
                                    ?.getAttribute('href');

                                const label = infoItem.querySelector(
                                    'a > span > div > span',
                                ).textContent;

                                const itemDetailList = item.querySelector(
                                    '.product-item-details',
                                );

                                const name =
                                    itemDetailList.querySelector(
                                        'a',
                                    ).textContent;

                                const oldPrice = itemDetailList.querySelector(
                                    '.old-price > span > span:nth-child(2) > span',
                                )?.textContent;

                                const normalPrice =
                                    itemDetailList.querySelector(
                                        '.normal-price > span > span:nth-child(2) > span',
                                    )?.textContent;

                                const slugId = link.split('/').slice(-1);

                                const pagination = document.querySelector(
                                    '#wrapper-product-list > .toolbar-products > .pages',
                                );

                                if (pagination) {
                                    lastPage =
                                        pagination
                                            .querySelector('ul > li:last-child')
                                            ?.getAttribute('class') ===
                                        'item pages-item-next'
                                            ? pagination.querySelector(
                                                  'ul > li:nth-last-child(2) > a > span:last-child',
                                              )?.textContent
                                            : pagination.querySelector(
                                                  'ul > li:last-child> strong > span:last-child',
                                              )?.textContent;
                                }

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

            return { productList, lastPage: Number(lastPage) };
        } catch (error) {
            console.log(error);
            return { success: false };
        }
    },

    async getDetailList({ url, reqParams }) {
        const detailList = [];
        const data = {};

        try {
            await axios(url + reqParams).then((response) => {
                const html = response.data;
                const document = parse(html);

                const breakCrumb = [];
                document
                    .querySelectorAll(
                        '.breadcrumbs > .items > li:not(:last-child, :first-child)',
                    )
                    .forEach((li) => {
                        const text =
                            li.querySelector('a')?.textContent.trim() || '';
                        const slugName =
                            li
                                .querySelector('a')
                                ?.getAttribute('href')
                                ?.split('/')
                                .slice(-1)
                                .join('') || '';
                        breakCrumb.push({
                            text,
                            slug: `${slugName}`,
                        });
                    });

                const name = document
                    .querySelector('.product-info-main')
                    ?.querySelector('div:first-child > h1 > span')?.textContent;

                const sold = document
                    .querySelector('.product-info-main')
                    ?.querySelector('div:nth-child(2) > .sold')?.textContent;

                const sku = document
                    .querySelector('.product-info-main')
                    ?.querySelector('div:nth-child(2) > div:nth-child(2)')
                    ?.querySelector('.value')?.textContent;

                const oldPrice = document
                    .querySelector('.old-price')
                    ?.querySelector('.price').firstChild?.textContent;

                const normalPrice = document
                    .querySelector('.normal-price')
                    ?.querySelector('.price').firstChild?.textContent;

                const image = document
                    .querySelector('.product.media')
                    ?.querySelector('img')
                    ?.getAttribute('src');

                const sizeChart = {};
                sizeChart.mobile =
                    document
                        .querySelector('.sizechart > img.size-mobile')
                        ?.getAttribute('src') || '';
                sizeChart.desktop =
                    document
                        .querySelector('.sizechart > img.size-desktop')
                        ?.getAttribute('src') || '';

                const featureList = [];
                document
                    .querySelectorAll('.feature > div > div')
                    .forEach((item) => {
                        const icon =
                            item.querySelector('img')?.getAttribute('src') ||
                            '';
                        const title =
                            item.querySelector('h3')?.textContent || '';
                        const desc = item.querySelector('p')?.textContent || '';

                        featureList.push({ icon, title, desc });
                    });

                const materialList = [];
                document.querySelectorAll('.material > div').forEach((item) => {
                    const per =
                        item.querySelector('p:nth-child(1)')?.textContent || '';
                    const name =
                        item.querySelector('p:nth-child(2)')?.textContent || '';
                    materialList.push({ per, name });
                });

                let content = [];
                document
                    .querySelectorAll(
                        '.description > div > div.pagebuilder-column:first-child > h2',
                        html,
                    )
                    .forEach((item) => {
                        const title = item?.textContent || '';
                        content.push({ title });
                    });

                document
                    .querySelectorAll(
                        '.description > div > div.pagebuilder-column:first-child > div',
                    )
                    .forEach((item, i) => {
                        const desc = item.querySelector('p')?.textContent || '';
                        const listDesc = [];

                        item.querySelectorAll('ul > li').forEach((liItem) => {
                            const item = liItem?.textContent || '';
                            listDesc.push(item);
                        });
                        content[i] = { ...content[i], desc, listDesc };
                    });

                const productRelative = [];
                document
                    .querySelectorAll('.product-items > div')
                    .forEach((item) => {
                        const image =
                            item
                                .querySelector('img')
                                ?.getAttribute('data-src') || '';
                        const name =
                            item.querySelector('.product-item-name > a')
                                ?.textContent || '';
                        const normalPrice =
                            item
                                .querySelector('.normal-price')
                                ?.querySelector('.price')?.textContent || '';
                        const oldPrice =
                            item
                                .querySelector('.old-price')
                                ?.querySelector('.price')?.textContent || '';
                        const label =
                            item.querySelector('.product-label > span')
                                ?.textContent || '';
                        const slugId =
                            item
                                .querySelector('a:first-child')
                                ?.getAttribute('href')
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
                data[property] = detailList[0][property] || '';
            }

            return data;
        } catch (error) {
            console.log(error);
            return { success: false };
        }
    },

    async getHardDataDetail({ url, reqParams }) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url + reqParams, { waitUntil: 'networkidle2' });

        const listOption = await page.evaluate(() => {
            const color = [];
            const size = [];
            const gallery = [];

            document
                .querySelectorAll(
                    '.swatch-attribute.color > div > .swatch-option.image',
                )
                .forEach((item) => {
                    const image = item.getAttribute('option-tooltip-value');
                    const id = item.getAttribute('aria-label')
                    color.push({ id, image });
                });

            document
                .querySelectorAll(
                    '.swatch-attribute.size > div > .swatch-option',
                )
                .forEach((item) => {
                    const isDisabled = item.classList.contains('disabled');
                    const sizeLabel = item.getAttribute('option-label');

                    size.push({ isDisabled, size: sizeLabel });
                });

            document
                .querySelectorAll(
                    '.fotorama__stage__shaft.fotorama__grab > div',
                )
                .forEach((item) => {
                    gallery.push(item.getAttribute('href'));
                });

            return { gallery, color, size };
        });

        await browser.close();
        return { listOption };
    },
};

export default OnoffModel;
