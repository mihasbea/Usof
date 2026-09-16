const User = require('../models/User');
const bcrypt = require('bcrypt');

class UserController {
    static async getAll(req, res) {
        try {
            const users = await User.findAll();
            return res.status(200).json(users);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: `Internal server error` });
        }
    }

    static async getById(req, res) {
        try {
            const {user_id} = req.params;
            if (!user_id) {
                return res.status(400).json( { message:'Id field is required' } );
            }

            const user = await User.findById(user_id);

            if(!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json(user);
        } catch(error){
            console.log(error);
            return res.status(500).json({ message: `Internal server error` })
        }
    }

    static async create(req, res) {
        try {
            const {login, password, password_confirmation, full_name, email, role} = req.body;

            if (!login || !password || !password_confirmation || !full_name || !email || !role) {
                return res.status(400).json({message: 'All fields are required'});
            }

            if (password !== password_confirmation) {
                return res.status(400).json({message: 'Passwords do not match'});
            }

            if (await User.findByEmail(email) || await User.findByLogin(login)) {
                return res.status(409).json({message: 'Email or login already in use'});
            }

            const allowedRoles = ['user', 'admin'];

            if(!allowedRoles.includes(role)) {
                return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUserData = {
                login: login,
                password: hashedPassword,
                full_name: full_name,
                email: email,
                role: role
            };
            await User.create(newUserData);
            return res.status(201).json({message: 'User created successfully'});

        } catch (error) {
            console.error('Error during admin user creation:', error);
            return res.status(500).json({message: 'Internal server error'});
        }
    }
}

module.exports = UserController;