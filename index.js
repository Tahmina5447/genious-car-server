const express=require('express');
const app = express();
const cors = require('cors');
const port =process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt=require('jsonwebtoken');
require('dotenv').config();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.01makvu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req,res,next){
  const authHeader=req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'unauthorized access'})
  }
  const token=authHeader.split(' ')[1];
  console.log(token)
  jwt.verify=(token,process.env.TOKEN,function(err,decoded){
    if(err){
      return res.status(401).send({message:'unauthorized access'})
    }
    req.decoded=decoded;
    next();
  })


}


async function run(){
  try{
    const servicesCollection = client.db("GeniousCar").collection("services");
    const orderCollection=client.db("GeniousCarOrder").collection("order");
    

    app.post('/jwt',(req,res)=>{
      const user=req.body;
      // console.log(user)
      const token=jwt.sign(user,process.env.TOKEN,{expiresIn:'1d'});
      res.send({token});
    })



    app.get('/services',async(req,res)=>{
      const query={};
      const cursor=servicesCollection.find(query);
      const services=await cursor.toArray();
      res.send(services);
    })

    app.get('/services/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:ObjectId(id)}
      const service=await servicesCollection.findOne(query);
      res.send(service);
    })


    // order

    app.get('/order',verifyJWT,async(req,res)=>{
      const decoded=req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({message:'unauthorized access'})
      }
      let query={};
      console.log(req.query.email)
      if(req.query.email){
        query={
          email:req.query.email
        }
      }
      const cursor=orderCollection.find(query);
      const orders=await cursor.toArray();
      res.send(orders);
    })

    app.post('/order',async(req,res)=>{
      const order=req.body;
      const result=await orderCollection.insertOne(order);
      res.send(result);
    })

    app.patch('/order/:id',async(req,res)=>{
      const id=req.params.id;
      const status=req.body.status;
      const query={_id:ObjectId(id)}
      const updatedOrder={
        $set:{
          status:status
        }
      }
      const result = await orderCollection.updateOne(query,updatedOrder);
      res.send(result);
    })

    app.delete('/order/:id',async(req,res)=>{
      const id= req.params.id;
      const query={_id:ObjectId(id)}
      const result=await orderCollection.deleteOne(query);
      res.send(result);
    })

  }finally{

  }
}
run().catch(err=>console.log(err));


app.get('/', (req, res) => {
      res.send('Hello World!')
    })


 app.listen(port, () => {
     console.log(` port ${port}`)
   })

