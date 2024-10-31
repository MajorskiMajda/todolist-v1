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

app.post("/", async (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    try {
        if (listName === "day") {
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving item to the list");
    }
});

async function itemDelete(checkedItemId) {
    const del = await Item.findByIdAndDelete(checkedItemId)
}
app.post("/delete",async (req, res) => {
    const listName = req.body.listName;
    const checkedItemId = (req.body.checkbox);
    try {
        // Delete the item from the Item collection
        if (listName === "day") {
            await itemDelete(checkedItemId);
        }

        // Update the list by pulling the deleted item
        await List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        );

        // Redirect after both operations are successful
        res.redirect("/" + listName);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating the list");
    }
    
})

app.get("/:customListName",  (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    if (customListName === 'Favicon.ico') {
        return res.status(204).send(); // No content
    }

    List.findOne({ name: customListName }).then((foundList) => {
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save().then(() => {
                // Redirect to the new list
                res.redirect("/" + customListName);
            });
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    });
});



app.listen(process.env.PORT, () => {
    console.log("server is running")
})
