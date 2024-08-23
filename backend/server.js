const mongoose = require("mongoose"),
      dotenv=require("dotenv")

dotenv.config({path: "./config/config.env"});
process.on("uncaughtException",(err)=>{
    console.error("Uncaught Exception:", err);
    process.exit(1); // 1 stands for uncaught exception
})
const app = require("./app");
const connection =async()=>{
    try{
        await mongoose.connect(process.env.LOCAL_MONGO_CONN);
        console.log("DB connected successfully....!");
    }catch(err){
        console.log("Error connecting to DB", err);
        process.exit(1);
    }
}
connection();
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}!`);
});
process.on("unhandledRejection",(err)=>{
    console.error("Unhandled Rejection:", err);
    server.close(() => { //close the server gradually
        process.exit(1); // 1 stands for uncaught exception
    });
})