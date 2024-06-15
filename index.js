const express = require('express')
const app = express()
const port = 3000
const path = require('path')
app.use(express.static('public'))
const ejs = require('ejs')
app.set('view engine', 'ejs')
const sql = require("mssql/msnodesqlv8");
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var config = {
    server: "DESKTOP-E43PI42\\MSSQLSERVER2017", //Khac nhau voi moi may
    database: "nodeExam",
    options: {
        trustedConnection: true
    }
}
sql.connect(config, err => {
    if (err) {
        throw err;
    }
    console.log("Connection Successful!");
});
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

app.get('/view', async (req, res) => {
    const {sortBy = 'ProductStoreCode', sortOrder = 'DESC'} = req.query;
    const validColumns = ['ProductCode', 'ProductName', 'ProductDate', 'ProductOriginPrice', 'Quantity', 'ProductStoreCode'];

    const validOrders = ['ASC', 'DESC'];

    // valid sortBy and sortOrder (not allow other values to prevent sql inject)
    if (!validColumns.includes(sortBy) || !validOrders.includes(sortOrder)) {
        return res.status(400).send('Invalid sorting parameters');
    }

    try {
        //sort desc order base on Product Store Code
        const query = `SELECT * FROM ProductCollection ORDER BY ${sortBy} ${sortOrder}`;
        const result = await sql.query(query);
        res.render('view', {products: result.recordset, sortBy, sortOrder});
    } catch (err) {
        res.status(500).send('Error fetching Product: ' + err);
    }
});


//view add
app.get('/add', (req, res) => {
    res.render('add');
})

//api add
app.post('/add', async (req, res) => {
    try {
        const { productCode, productName, productDate, productOriginPrice, quantity, productStoreCode } = req.body;

        // Use parameterized query to safely insert values into the database
        await sql.query`
            INSERT INTO dbo.ProductCollection 
            (ProductCode, ProductName, ProductDate, ProductOriginPrice, Quantity, ProductStoreCode) 
            VALUES 
            (${productCode}, ${productName}, ${productDate}, ${productOriginPrice}, ${quantity}, ${productStoreCode});
        `;

        return res.redirect('/view');
    } catch (err) {
        console.error('Cannot add new product', err);
        res.status(500).send('Cannot add new product');
    }
});
//api delete
app.post('/delete/:ProductCode', async (req, res) => {
    try {
        const {ProductCode} = req.params;
        await sql.query`DELETE FROM ProductCollection WHERE ProductCode = ${ProductCode}`;
        return res.redirect('/view');
    } catch (err) {
        return res.status(500).send('Error deleting product: ' + err);
    }
});