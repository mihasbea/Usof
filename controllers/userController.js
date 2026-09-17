const User = require('../models/User');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

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
                role: role,
                email_confirmed: true
            };
            await User.create(newUserData);
            return res.status(201).json({message: 'User created successfully'});

        } catch (error) {
            console.error('Error during admin user creation:', error);
            return res.status(500).json({message: 'Internal server error'});
        }
    }

    static async uploadAvatar(req, res) {
        try {
            if(!req.file) {
                return res.status(400).json({ message: 'Please upload an image file' });
            }

            const filePath = `/uploads/avatars/${req.file.filename}`;
            const user = await User.findById(req.user.id);

            if (user.profile_picture) {
                const oldAvatarPath = path.join(process.cwd(), user.profile_picture);
                try {
                    await fs.unlink(oldAvatarPath);
                } catch (err) {
                    console.error('Old avatar not found on disk, skipping deletion.');
                }
            }

            await User.update(user.id, { profile_picture: filePath });
            return res.status(200).json({ message: 'Avatar uploaded successfully'});
        } catch(error) {
            console.error('Error during avatar upload: ', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async update(req, res) {
        try {
            const {user_id} = req.params;
            const allowedFields = ['login', 'email', 'password', 'password_confirmation', 'full_name']

            const updateData = {};
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }

            const user = await User.findById(user_id);
            if(!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (updateData.password) {
                if (updateData.password != updateData.password_confirmation) {
                    return res.status(400).json({ message: 'Passwords do not match' });
                }
                updateData.password = await bcrypt.hash(updateData.password, 10);
            }
            delete updateData.password_confirmation;
            
            if (updateData.login && updateData.login !== user.login) {
                if (await User.findByLogin(updateData.login)) {
                    return res.status(409).json({ message: 'Login is already taken' });
                }
            }

            if (updateData.email && updateData.email !== user.email) {
                if(await User.findByEmail(updateData.email)) {
                    return res.status(409).json({ message: 'Email is already taken' });
                }
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(200).json({message: 'No changes provided'});
            }

            await User.update(user_id, updateData);
            return res.status(200).json({ message: 'User updated successfully' });
        } catch(error) {
            console.error('Error during user update:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async delete(req, res) {
        try {
            const { user_id } = req.params;
            const user = await User.findById(user_id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            await User.delete(user_id);
            return res.status(200).json({ message: 'User deleted successfully' });
        } catch(error) {
            console.error('Error during user deletion:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = UserController;