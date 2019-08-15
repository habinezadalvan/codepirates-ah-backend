import cloudinary from 'cloudinary';
import { config } from 'dotenv';
import UserService from '../services/user.service';
import Util from '../helpers/util';

const util = new Util();
config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * @description User profile
 */
class Profile {
  /**
         * @description get user profile
         * @param {object} req
         * @param {object} res
         * @returns {object} return object containing user profile
         */
  static async getProfile(req, res) {
    const userName = req.params.username;

    try {
      let userfound;
      if (userName) {
        userfound = await UserService.findOne('', userName);
      } else {
        userfound = await UserService.findOne(req.auth.email, '');
      }
      if (!userfound) {
        util.setError(404, 'Profile not found');
        return util.send(res);
      }
      const data = {
        username: userfound.username,
        bio: userfound.bio,
        image: userfound.image,
      };
      util.setSuccess(200, 'Successfully retrieved a user profile', data);
      return util.send(res);
    } catch (err) {
      util.setError(400, 'we are facing some problemsin system, please contact administrator');
      return util.send(res);
    }
  }

  /**
         * @description update user profile
         * @param {object} req
         * @param {object} res
         * @returns {object} return object containing updated user profile
         */
  static async updateProfile(req, res) {
    let filename = '';
    if (req.files.image) {
      filename = req.files.image.path;
    }
    cloudinary.v2.uploader.upload(filename, { tags: 'CodepiratesAuthors-haven' }, async (err, image) => {
      try {
        const userName = req.auth.email;
        const user = await UserService.findOne(userName, '');
        const oldURL = user.image;
        if (!user) {
          util.setError(400, 'User not found');
          return util.send(res);
        }
        const usernamefound = await UserService.getUserByUserName(req.body.username, userName);
        if (usernamefound) {
          util.setError(409, 'Sorry! The profile username taken, try another one');
          return util.send(res);
        }
        let imgURL;
        if (!err) {
          imgURL = image.secure_url;
        }
        if (!imgURL) {
          imgURL = oldURL;
        }
        const prof = {
          email: req.auth.email,
          username: req.body.username,
          bio: req.body.bio,
          image: imgURL,
        };
        const updateProfile = await UserService.updateProfile(prof);
        const newProfile = {
          userName: updateProfile[1].username,
          email: updateProfile[1].email,
          bio: updateProfile[1].bio,
          image: updateProfile[1].image,
          upadatedAt: updateProfile[1].upadatedAt,
        };
        util.setSuccess(200, 'Successfully Profile Updated.', newProfile);
        return util.send(res);
      } catch (error) {
        util.setError(400, 'we are having some problems in system, please contact administrator');
        return util.send(res);
      }
    });
  }
}
export default Profile;
