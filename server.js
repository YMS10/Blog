//Declare Variables
const express = require('express')
const multer = require('multer')
const port = process.env.port || 3000
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const https = require('https')
const path = require('path')
const fs = require('fs')
const $ = require('jquery');
const app = express()

//Set And Use Functions
app.set("view engine", "ejs")
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json());

//Connect To DB
mongoose.connect("mongodb+srv://youssef:admin123@blog.stdjxwa.mongodb.net/Website", { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

//Multer Storage
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

//Multer Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
})

//Post Schema
const PostSchema = new mongoose.Schema({
    Title: String,
    Desc: String,
    Catg: String,
    Image: {
        data: Buffer,
        contentType: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

PostSchema.index({createdAt : -1})

//Category Schema
const CatgSchema = new mongoose.Schema({
    Title: String,
})

//Post Model
const Post = mongoose.model("Post", PostSchema)

//Catgeory Model
const Catg = mongoose.model("Category", CatgSchema)

//Home Page
app.get('/', (req, res) => {
    Post.find().sort({ createdAt: -1 }).limit(3)
    .then((posts) => {
        res.render('home', {posts : posts})
    })
    .catch((err) => {
        console.error(err)
    })
})

//About Page
app.get('/about', (req, res) => {
    res.render('about')
})

//Contact Page
app.get('/contact', (req, res) => {
    res.render('contact')
})

//Add Post Page
app.get('/addpost', (req, res) => {
    Catg.find()
        .then((catgs) => {
            res.render('addPost', {catgs : catgs})
        })
        .catch((err) => {
            console.error(err)
        })
})

//Post Function For Adding Post
app.post('/add', upload.single('image'), (req, res) => {
    var posttitle = req.body.title
    var postdesc = req.body.desc
    var postcatg = req.body.catg

    const post = new Post({
        Title: posttitle,
        Desc: postdesc,
        Catg: postcatg,
        Image: {
            data: fs.readFileSync(path.join(__dirname + '/public/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    })

    post.save()
        .then(() => {
            console.log("Object Saved") 
            res.redirect('/')
        })
        .catch((err) => {console.error(err)})
})

//All Posts Page
app.get('/allposts', async (req, res) => {
    try {
        const posts = await Post.find();
        const catgs = await Catg.find();
        res.render('allPosts', { posts, catgs });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
})

//Post Details Page
app.get('/post/:id', (req, res) => {
    Post.findById(req.params.id)
        .then((post) => {
            res.render('post_detail', { post : post });
        })
        .catch((err) => {
            console.error(err)
        })
});

//Add Category Page
app.get('/addcategory', (req, res) => {
    res.render('addCatg');
});

//Post Category Page
app.post('/addcategory', (req, res) => {
    const title = req.body.title;
    console.log(title)
    const newCategory = new Catg({
      Title: title
    });
    newCategory.save()
        .then(() => {
            console.log("Saved") 
            res.redirect('/allposts')
        })
        .catch((err) => {console.error(err)})
});

//Get The Search Form
var postMade = false
app.get('/search', async (req, res) => {
    const query = req.query.q

    app.post('/filter-search', async (req, res) => {
        const catg = req.body.category;
        try {
          const posts = await Post.find({
            $and: [
              { Title: { $regex: query, $options: 'i' } },
              { Catg: catg }
            ]
          });
          const catgs = await Catg.find();
          res.render('search_result', { posts, catgs });
        } catch (err) {
          console.error(err);
          res.status(500).send('Server Error');
        }
      });
    postMade == false

    if(postMade === false){
        try {
            const posts = await Post.find({ $or: [
                { Title: { $regex: query, $options: 'i' } },
              ]});
            const catgs = await Catg.find();
            res.render('search_result', { posts, catgs });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
})  

//Filters
app.post('/filter', async (req, res) => {
    const query = req.body.category;
    console.log(query)
  
    if (query) {
      const posts = await Post.find({ Catg: query })
      const catgs = await Catg.find()
      res.render('allPosts', { posts, catgs });
    } else {
    const posts = await Post.find()
    const catgs = await Catg.find()
      res.render('allPosts', { posts, catgs });
    }
});
//Post The Wather Form
app.post('/weather', (req, res) => {
    const query = req.body.cityName
	const apiKey = "39c9fc2b7a70ed3a07c0fa2a5b29d5db"
	const units = "metric"
	const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=${units}`
	https.get(url, (response) => {
		response.on("data", function(data){
			const weatherData = JSON.parse(data)
			const temp = weatherData.main.temp
			const desc = weatherData.weather[0].description
			const icon = weatherData.weather[0].icon
			const imageUrl = "http://openweathermap.org/img/wn/" + icon + "@2x.png"
            res.render('api', {temp, desc, icon, query})
		})
	})
})

//Listening To Server
app.listen(3000, () => {
    console.log('server Started')
})