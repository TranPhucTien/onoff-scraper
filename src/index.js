import dotenv from 'dotenv';
import express from 'express';
import createError from 'http-errors';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

routes(app);
app.get('/', (req, res) => {
    res.status(200).json({ success: true, link: `http://localhost:${port}/api/nam.html` });
});

// Catch 404
app.use((req, res, next) => {
    next(createError(404, '404 Not Found!'));
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at ${port}`);
});
