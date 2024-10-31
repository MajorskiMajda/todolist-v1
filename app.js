const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require("lodash")

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"))

mongoose.connect("mongodb+srv://admin-majda:test123@cluster0.xti3x.mongodb.net/todolistDB?retryWrites=true&w=majority");

const itemsSchema = {
    name: String
};

const Item = mongoose.model(
    "Item", itemsSchema
)

const item1 = new Item({
    name: "welcome to yout rodo list!"
})
const item2 = new Item({
    name: "hello from majda"
})

const defaultItems = [item1, item2];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

async function getItems(){

    const Items = await Item.find({});
    return Items;
  
}


app.get("/", (req, res) => {
    getItems().then(function (FoundItems) {
        if (FoundItems.length === 0) {
            Item.insertMany(defaultItems);
            res.redirect("/")
        }
        else {
            res.render("list", { listTitle: "day", newListItems: FoundItems });
        }
    
      });
    
})

app.post("/", (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;


    
    const item = new Item({
        name: itemName
    })

    if (listName === "day") {
        
        item.save().then(()=> {
        res.redirect("/")
    })
    } else {
        List.findOne({name: listName}).then((foundList) => {
            foundList.items.push(item);
            foundList.save()
            res.redirect("/" + listName)
        })
    }
})
app.post("/delete", (req, res) => {
    const listName = req.body.listName;
    const checkedItemId = (req.body.checkbox);

    if (listName === "day") {
        async function itemDelete() {
            const del = await Item.findByIdAndDelete(checkedItemId)
        }
        itemDelete()
        res.redirect("/")
    }
    List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
    ).then((foundList) => {
        res.redirect("/" + listName); // Redirect regardless of whether an error occurred or not
    }).catch((err) => {
        console.error(err); // Log the error
        res.status(500).send("Error updating the list");
    });
    
})

app.get("/:customListName",  (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }).then((foundList) => {
        if (!foundList && customListName!== 'favicon.ico') {
            const list = new List({
                name: customListName,
                items: defaultItems
                
            }   )
            list.save().then(() => {
                // Redirect to the new list
                res.redirect("/" + customListName);
            });
        } else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        }
    })
});



app.listen(process.env.PORT, () => {
    console.log("server is running")
})