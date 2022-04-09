const mongoose = require('mongoose');
// async function connect() {
//     try {
//         await mongoose.connect(`${process.env.DB_URL}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             useFindAndModify: false,
//             useCreateIndex: true
//         });
//         console.log('Connect Successfully!!');
//     } catch (error) {
//         console.log('Connect Failed!!! Error:' +error);
//     }
// }

async function connect() {
    try {
        await mongoose.connect(`mongodb+srv://sonthanhtungst:01246155208Tt@it-blizzard-project.cmro1.mongodb.net/IT-blizzard-project?retryWrites=true&w=majority`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('Connect Successfully!!');
    } catch (error) {
        console.log('Connect Failed!!! Error:' +error);
    }
}
module.exports = { connect };

// 