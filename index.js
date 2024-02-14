const express = require('express');
const dbConnect = require('./config/dbConnect');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const authRouter = require('./routes/authRoute.js');
const productRouter = require('./routes/productRoute.js')
const blogRouter = require('./routes/blogRoute.js');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('./middlewares/errorHandler.js');
const morgan = require('morgan');


dbConnect();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));



app.use('/api/user',authRouter);
app.use('/api/product',productRouter);
app.use('/api/blog',blogRouter);

app.use(notFound);
app.use(errorHandler);


app.listen(PORT, ()=>{
    console.log(`Server started at PORT ${PORT}`);
})