const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const util = require('util');

const router = express.Router();

// Configure multer to save files to a temporary 'uploads' directory.
const upload = multer({ dest: 'uploads/' });
const unlinkFile = util.promisify(fs.unlink);

// This route expects an array of files under the 'images' field.
router.post('/detect', upload.array('images', 5), async (req, res) => {
  const uploadedFiles = req.files;

  // It's good practice to have a default URL, but also to check if the environment variable is set.
  const aiDetectionUrl = process.env.AI_DETECTION_URL || 'http://127.0.0.1:8000/detect';
  if (!process.env.AI_DETECTION_URL) {
    console.warn('AI_DETECTION_URL environment variable not set. Using default: http://127.0.0.1:8000/detect');
  }

  try {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'No images were uploaded.' });
    }

    // Create an array of promises, one for each AI detection request.
    const detectionPromises = uploadedFiles.map(file => {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(file.path), {
        filename: file.originalname,
      });

      return axios.post(aiDetectionUrl, formData, {
        headers: formData.getHeaders(),
      });
    });

    // Wait for all detection requests to complete concurrently.
    // Using Promise.allSettled allows you to handle partial failures,
    // where some images are processed successfully and others fail.
    const detectionResponses = await Promise.allSettled(detectionPromises);

    // Extract the data from each successful AI service response.
    const results = detectionResponses.map(response => {
      if (response.status === 'fulfilled') {
        return response.value.data;
      }
      return { error: 'AI detection for this image failed.' };
    });

    res.json(results);
  } catch (err) {
    console.error('AI Detection Route Error:', err.message);
    res.status(500).json({ message: 'AI detection failed. Please check the service.' });
  } finally {
    // Always clean up the uploaded files, even if an error occurred.
    if (uploadedFiles) {
      await Promise.all(uploadedFiles.map(file => unlinkFile(file.path).catch(e => console.error(`Failed to delete temporary file ${file.path}:`, e))));
    }
  }
});

module.exports = router;