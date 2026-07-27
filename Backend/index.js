const express=require('express');
const cors=require('cors');
const bcrypt=require('bcrypt');
const mysql=require('mysql2');

const app=express();

app.use(cors());
app.use(express.urlencoded({ extended: true}));

const connection = mysql.createConnection({
    host: 'localhost',      // Database host
    user: 'root',           // Your database username
    password: 'Raksha@123',   // Your database password
    database: 'myDiary'     // The name of the database
})

connection.connect((err) =>{
    if(err){
        console.error('Error connecting to the database:',err);
        return;
    }
    console.log('Connected to the MySQL database!');
});
app.get('/',(req,res)=>{
    console.log(req)
    res.status(200).json({message:'Successful'})
})

app.post('/registerUser', async (req,res)=>{
    console.log(req.body);
    const {email,password}=req.body
   
    try {

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password: ",hashedPassword)
    connection.query(`insert into Users(EmailID,HashedPassword) values('${email}','${hashedPassword}')`,(err,results)=>{
        if(err){
            res.status(500).send('no')
        }
        res.status(200).send('okay')
    })
} catch (err) {
    console.error(err);
    res.status(500).send('Error while hashing password');
    }

    res.status(200).json({message:'User Registered'})
})

app.post('/userLogin',async(req,res)=>{
    console.log("User logged in: ",req.body);
    const { email,password}=req.body;

    // let hashedPassword = '$2b$10$RC60OlojCJmZnMAeDiXuXeSmqRMfRQaXL1S6fdlakV.cERZNREqe.';
     let hashedPassword='';
     let userID=''
     connection.query(`select ID, HashedPassword from Users where EmailID='${email}'`,async(err,result)=>{
        if(err){
            res.status(500);
            return
        }
        // console.log("Line 63:",result);
        hashedPassword=result[0].HashedPassword;
        userID = result[0].ID;
        // console.log(hashedPassword)
        let response = await bcrypt.compare(password,hashedPassword)
        // console.log("Line 68: ",response);
        if(response){
            res.status(200).json({userID:userID})
            return
        }else{
            res.status(500)
            return
        }
     })
    // console.log('Is same? ' , response);
    // res.send(200).send('Matched')
})

app.post('/forgotPassword', async(req,res)=>{

    const {email,password}=req.body;

    const hashedPassword = await bcrypt.hash(password,10);

    connection.query(
        `update Users
         set HashedPassword='${hashedPassword}'
         where EmailID='${email}'`,
        (err,result)=>{

            if(err){
                res.status(500).send("Error");
                return;
            }

            if(result.affectedRows==0){
                res.status(404).send("Email not found");
                return;
            }

            res.status(200).send("Password Updated");
        });

});

app.post('/newPost',async(req,res) =>{
    const{postTitle,postDescription,userID}=req.body;
    connection.query(`insert into Posts(UserID,postTitle,postDescription)values(${userID},"${postTitle}","${postDescription}")`,async(err,response)=>{
      if(err){
            res.status(500);
            return
        }  
        res.status(200)
    })

    console.log("New Post: ",req.body);
})

app.get('/getMyPosts', (req, res) => {

    connection.query(
        `SELECT
            ID,
            postTitle AS title,
            postDescription AS description
        FROM Posts
        WHERE UserID=${req.query.userID}`,
        (err, result) => {

            if (err) {
                res.status(500).send(err);
                return;
            }

            res.status(200).json(result);
        }
    );

});

app.get('/getPost', (req, res) => {

    connection.query(
        `SELECT
            postTitle AS title,
            postDescription AS description
         FROM Posts
         WHERE ID=${req.query.id}`,
        (err, result) => {

            if (err) {
                res.status(500).send(err);
                return;
            }

            res.status(200).json(result[0]);
        }
    );

});

app.delete('/deletePost', (req, res) => {

    const id = req.query.id;

    connection.query(
        `DELETE FROM Posts WHERE ID=${id}`,
        (err, result) => {

            if (err) {
                res.status(500).send("Error deleting post");
                return;
            }

            res.status(200).send("Post Deleted");

        }
    );

});

app.listen(3000,()=>{
    console.log('Server started on port 3000!')
})