const mongoose = require('mongoose');
const config = require('config');
const User = require('../models/User');
const District = require('../models/District');
const Site = require('../models/Site');
const Siren = require('../models/Siren');

// Connect to MongoDB
mongoose.connect(config.get('mongoURI'), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const migrateData = async () => {
    try {
        console.log('Starting migration to role-based system...');

        // 1. Create a default admin user if none exists
        const adminExists = await User.findOne({ userType: 'admin' });
        if (!adminExists) {
            console.log('Creating default admin user...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            const adminUser = new User({
                name: 'System Administrator',
                email: 'admin@decibel.company',
                password: hashedPassword,
                userType: 'admin',
                emailVerified: true,
                avatar: config.get('avatarBaseURI') + 'System+Administrator',
            });
            
            await adminUser.save();
            console.log('Default admin user created: admin@decibel.company / admin123');
        }

        // 2. Create a default district if none exists
        const districtExists = await District.findOne();
        if (!districtExists) {
            console.log('Creating default district...');
            const adminUser = await User.findOne({ userType: 'admin' });
            
            const defaultDistrict = new District({
                id: 'DEFAULT',
                name: 'Default District',
                blocks: ['Default Block'],
                createdBy: adminUser._id,
            });
            
            await defaultDistrict.save();
            console.log('Default district created');
        }

        // 3. Create a default site if none exists
        const siteExists = await Site.findOne();
        if (!siteExists) {
            console.log('Creating default site...');
            const adminUser = await User.findOne({ userType: 'admin' });
            const defaultDistrict = await District.findOne();
            
            const defaultSite = new Site({
                id: 'SITE001',
                name: 'Default Site',
                location: {
                    lat: 28.6139, // Default to Delhi coordinates
                    lng: 77.2090,
                },
                district: defaultDistrict._id,
                block: 'Default Block',
                description: 'Default site created during migration',
                createdBy: adminUser._id,
            });
            
            await defaultSite.save();
            
            // Add site to district
            defaultDistrict.sites.push(defaultSite._id);
            await defaultDistrict.save();
            console.log('Default site created');
        }

        // 4. Update existing sirens to reference the default site
        const sirensWithoutSite = await Siren.find({ site: { $exists: false } });
        if (sirensWithoutSite.length > 0) {
            console.log(`Updating ${sirensWithoutSite.length} sirens to reference default site...`);
            const defaultSite = await Site.findOne();
            
            for (const siren of sirensWithoutSite) {
                siren.site = defaultSite._id;
                await siren.save();
            }
            console.log('Sirens updated successfully');
        }

        console.log('Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Login as admin@decibel.company with password admin123');
        console.log('2. Create districts and sites as needed');
        console.log('3. Create manager and operator users');
        console.log('4. Assign districts to managers and operators');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        mongoose.disconnect();
    }
};

// Run migration
migrateData();
