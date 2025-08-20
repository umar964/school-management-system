const express = require('express');
const mySql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mySql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 
    
});

db.connect(err=>{
    if(err) throw err;
    console.log('Connected to the database');
    
});

 

//Make all route here for small project and for large project make a aseprate file for each route, controller,services


app.post('/addSchools',(req,res)=>{
    const {name,address,latitude,longitude} = req.body;
    if(!name || !address || !latitude || !longitude){
        return res.status(400).json({error: 'All fields are required'});
    }
    const query = 'INSERT INTO schools (name,address,latitude,longitude) VALUES (?,?,?,?)';
    db.query(query,[name,address,latitude,longitude],(err,result)=>{
        if(err) {
            console.error('Error inserting school:', err);
            return res.status(500).json({error: err.message})
        };
        res.status(201).json({message: 'School added successfully', id: result.insertId});
    });
});

app.get('/listSchools', (req, res) => {
    //parseFloat converts string into number
    const uLat = parseFloat(req.query.latitude);
    const uLon = parseFloat(req.query.longitude);   

    if(!uLat || !uLon) return res.status(400).json({error: 'Coordinates required'});


   // Fetch all schools from the  schools table
    db.query('SELECT * FROM schools', (err, allSchools) => {
        if(err) return res.status(500).json({error: err.message});
     

    const R = 6371; //Radius of earth in km and this formula will calculate distance between two coords
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const schoolSorted = allSchools.map(school=>({
        ...school,
        distanceInKM : getDistance(uLat, uLon, school.latitude, school.longitude)
    })).sort((a,b)=> a.distanceInKM - b.distanceInKM); // sort in ascending order on the based of distance
    res.json(schoolSorted);
});
});

app.get('/', (req, res) => {
    res.send('Welcome to the School API');
});



app.listen(process.env.BACKEND_PORT,()=>{
    console.log(`Server is running on port ${process.env.BACKEND_PORT}`);
});

