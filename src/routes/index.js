import onoffRouter from './onOff.js';

function routes(app) {
    app.use('/api', onoffRouter);
}

export default routes;
