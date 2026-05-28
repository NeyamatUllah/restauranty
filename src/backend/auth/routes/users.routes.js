const express = require('express');
const router = express.Router();

const User = require('../models/User.model')
const { isAuthenticated } = require('../middleware/jwt.middleware')

// const fileUploader = require('./../config/cloudinary.config')

router.get("/", isAuthenticated, (req, res) => {

    User.find().then(users => {
        res.json(users)
    }).catch(err => {
        res.status(400).json(err)
    })

})

router.get("/:id", isAuthenticated, (req, res) => {

    const id = req.params.id

    User.findById(id).then(user => {
        res.json(user)
    }).catch(err => {
        res.status(400).json(err)
    })

})

router.put("/", isAuthenticated, (req, res) => {

    const user = req.body

    User.findByIdAndUpdate(user._id, user, { new: true }).then(newUser => {
        res.json(newUser)
    }).catch(err => {
        res.status(400).json(err)
    })

})

router.delete("/:id", isAuthenticated, (req, res) => {

    const id = req.params.id

    User.findByIdAndDelete(id).then(userDeleted => {
        res.json({
            message: "User Eliminado",
            userDeleted
        })
    }).catch(err => {
        res.status(400).json(err)
    })

})

module.exports = router;
