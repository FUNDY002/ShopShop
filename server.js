// code เก่าห
/*const express = require('express')
const mysql = require('mysql2')
const app = express()
const port = 3000

const db = mysql.createConnection(
    {
    host: "localhost",
    user: "root",
    password: "1234",
    database: "shopdee"
    }
)
db.connect()

app.use(express.json())                               //โค้ดนี้ใช้ Express middleware สำหรับการจัดการกับ JSON และ URL-encoded form data ที่ส่งมาใน request body
app.use(express.urlencoded ({extended: true}))         //ควรตรวจสอบว่า middleware ที่ใช้นั้นมีการตั้งค่าที่เหมาะสมและปลอดภัย

app.post('/product', function(req, res) {
    const { productName, productDetail, price, cost, quantity } = req.body;
    let sql = "INSERT INTO product (productName, productDetail, price, cost, quantity)"
        sql += "VALUES('"+ productName +"','"+ productDetail +"', "
        sql += price +","+ cost +"," + quantity + ")"
db.query(sql, function(err, result){
            if (err) throw err;
            res.send({'message':'บันทึกข้อมูลส ำเร็จ','status':true});  //ไม่มีการ encode ข้อมูล ซึ่งเปิดโอกาสให้เกิดการโจมตีประเภท XSS หากข้อมูลที่เก็บในฐานข้อมูลถูกใช้ใน response
     }
    )
})

    app.get('/product/:id',                             //การดึงข้อมูล product ตาม 'productID' โดยตรงจาก URL parameter โดยไม่มีการตรวจสอบ input เปิดโอกาสให้เกิด SQL Injection.
        function(req, res){                             //ควรใช้ prepared statements สำหรับการ query และ validate ค่าที่ส่งมาจาก URL parameter เพื่อให้แน่ใจว่าค่าที่ได้รับมานั้นถูกต้อง
            const productID = req.params.id;
            let sql = "SELECT * FROM product WHERE "
                sql += "productID=" + productID;
    db.query(sql,
        function(err, result) {
            if (err) throw err;
            res.send(result);
            }
        );
    }
);
app.post('/login', function(req, res){
    const {username, password} = req.body
    let sql = "SELECT * FROM customer WHERE "
    sql += "username='" + username + "'";                                   //Password ถูกเก็บในฐานข้อมูลเป็น plaintext ซึ่งไม่ปลอดภัย เพราะถ้าฐานข้อมูลรั่วไหล, password ทั้งหมดก็จะถูกเปิดเผย
    sql += " AND password = '" + password + "' AND isActive = 1";           //ควรใช้การ hash password (เช่นใช้ bcrypt) และใช้ prepared statements ในการ query ข้อมูล
    db.query(sql, [username, password], function(err, result){
        if(err) throw err

        if(result.length > 0){
            let customer = result[0]
            customer['message'] = "เข้ำสู่ระบบส ำเร็จ"
        customer['status'] = true

            res.send(customer)
        }else{
            res.send({"message":"กรุณำระบุรหัสผ่ำนใหม่อีกครั้ง",
                "status":false} )
        }
    })
} )
    app.listen(port, function() {
        console.log('server listening on port ${port}')   //ข้อความใน console.log มีข้อผิดพลาดที่ไม่ได้ใช้ backticks (``) อย่างถูกต้อง
})*/





    //code ใหม่
    const express = require('express');
    const mysql = require('mysql2');
    const bcrypt = require('bcrypt'); // สำหรับการแฮชรหัสผ่าน การนำเข้าโมดูล: bcrypt ถูกนำเข้ามาเพื่อใช้ในการแฮชและตรวจสอบรหัสผ่าน ซึ่งเป็นวิธีที่ปลอดภัยกว่าการเก็บรหัสผ่านในรูปแบบข้อความธรรมดา
    const app = express();
    const port = 3000;
    
    const db = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "1234",
        database: "shopdee"
    });
    db.connect();
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // เพิ่มข้อมูลผลิตภัณฑ์
    app.post('/product', function (req, res) {
        const { productName, productDetail, price, cost, quantity } = req.body;
        
        const sql = "INSERT INTO product (productName, productDetail, price, cost, quantity) VALUES (?, ?, ?, ?, ?)";  //Prepared Statements: ใช้ ? แทนการต่อสตริง SQL โดยตรง 
        const values = [productName, productDetail, price, cost, quantity];                                             //เพื่อลดความเสี่ยงจาก SQL Injection โดย db.query จะใช้ values เพื่อแทนที่ ? ด้วยค่าที่ได้รับ
        
        db.query(sql, values, function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send({'message': 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'status': false}); //การจัดการข้อผิดพลาด: ถ้ามีข้อผิดพลาดเกิดขึ้น (เช่น การเชื่อมต่อฐานข้อมูลล้มเหลว) 
            }                                                                                            //จะมีการส่งข้อความข้อผิดพลาดที่เหมาะสมและรหัสสถานะ HTTP 500 กลับไปยังผู้ใช้
            res.send({'message': 'บันทึกข้อมูลสำเร็จ', 'status': true});
        });
    });
    
    // ดึงข้อมูลผลิตภัณฑ์
    app.get('/product/:id', function (req, res) {
        const productID = req.params.id;
        
        const sql = "SELECT * FROM product WHERE productID = ?";  //Prepared Statements: ใช้ ? เพื่อป้องกัน SQL Injection เมื่อสร้างคำสั่ง SQL 
        db.query(sql, [productID], function (err, result) {         //เพื่อดึงข้อมูลตาม productID ที่ส่งมาจากพารามิเตอร์ของ URL
            if (err) {
                console.error(err);
                return res.status(500).send({'message': 'เกิดข้อผิดพลาดในการดึงข้อมูล', 'status': false});
            }
            res.send(result);
        });
    });
    
    // เข้าสู่ระบบ
    app.post('/login', function (req, res) {
        const { username, password } = req.body;
        
        const sql = "SELECT * FROM customer WHERE username = ? AND isActive = 1";   //Prepared Statements: ใช้ ? ในคำสั่ง SQL เพื่อลดความเสี่ยงจาก SQL Injection เมื่อค้นหาชื่อผู้ใช้
        db.query(sql, [username], function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send({'message': 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', 'status': false});
            }
            
            if (result.length > 0) {
                const customer = result[0];
                bcrypt.compare(password, customer.password, function (err, match) {   //การแฮชรหัสผ่าน: ใช้ bcrypt.compare เพื่อตรวจสอบรหัสผ่านที่ป้อนเข้ามากับรหัสผ่านที่แฮชในฐานข้อมูล 
                    if (err) {                                                         //แทนการเปรียบเทียบรหัสผ่านแบบข้อความธรรมดา
                        console.error(err);
                        return res.status(500).send({'message': 'เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน', 'status': false}); //การจัดการข้อผิดพลาด: ถ้ามีข้อผิดพลาดในการตรวจสอบรหัสผ่าน 
                    }                                                                                               //จะมีการส่งข้อความข้อผิดพลาดและรหัสสถานะ HTTP 500 กลับไปยังผู้ใช้ 
                    
                    if (match) {
                        customer['message'] = "เข้าสู่ระบบสำเร็จ";
                        customer['status'] = true;
                        res.send(customer);
                    } else {
                        res.send({"message": "รหัสผ่านไม่ถูกต้อง", "status": false});
                    }
                });
            } else {
                res.send({"message": "ชื่อผู้ใช้ไม่ถูกต้อง", "status": false});
            }
        });
    });
    
    app.listen(port, function () {              //ข้อความการเริ่มเซิร์ฟเวอร์: แสดงข้อความเมื่อเซิร์ฟเวอร์เริ่มทำงาน ซึ่งจะช่วยให้คุณทราบว่าเซิร์ฟเวอร์ทำงานอยู่และกำลังฟังอยู่ที่พอร์ตที่ระบุ
        console.log(`Server listening on port ${port}`);
    });
    