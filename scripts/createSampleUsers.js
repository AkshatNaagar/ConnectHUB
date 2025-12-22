require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const sampleUsers = [
    {
        name: 'Arpit',
        email: 'arpit@example.com',
        password: 'Password@123',
        headline: 'Full Stack Developer',
        bio: 'Passionate about building scalable web applications',
        location: 'Bangalore, India',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        experience: [],
        education: []
    },
    {
        name: 'Shaurav',
        email: 'shaurav@example.com',
        password: 'Password@123',
        headline: 'DevOps Engineer',
        bio: 'Cloud infrastructure and automation specialist',
        location: 'Mumbai, India',
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
        experience: [],
        education: []
    },
    {
        name: 'Gurkirat',
        email: 'gurkirat@example.com',
        password: 'Password@123',
        headline: 'Data Scientist',
        bio: 'Machine Learning and AI enthusiast',
        location: 'Delhi, India',
        skills: ['Python', 'TensorFlow', 'Data Analysis', 'ML'],
        experience: [],
        education: []
    },
    {
        name: 'Parneet Kaur',
        email: 'parneet@example.com',
        password: 'Password@123',
        headline: 'UI/UX Designer',
        bio: 'Creating beautiful and intuitive user experiences',
        location: 'Chandigarh, India',
        skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
        experience: [],
        education: []
    },
    {
        name: 'Archit',
        email: 'archit@example.com',
        password: 'Password@123',
        headline: 'Backend Developer',
        bio: 'Building robust and scalable APIs',
        location: 'Pune, India',
        skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Microservices'],
        experience: [],
        education: []
    },
    {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        password: 'Password@123',
        headline: 'Product Manager',
        bio: 'Strategic thinker with passion for user-centric products',
        location: 'Hyderabad, India',
        skills: ['Product Strategy', 'Agile', 'User Stories', 'Analytics'],
        experience: [],
        education: []
    },
    {
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
        password: 'Password@123',
        headline: 'Mobile App Developer',
        bio: 'Building amazing mobile experiences for iOS and Android',
        location: 'Noida, India',
        skills: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
        experience: [],
        education: []
    },
    {
        name: 'Ananya Singh',
        email: 'ananya.singh@example.com',
        password: 'Password@123',
        headline: 'Digital Marketing Specialist',
        bio: 'Helping brands grow through data-driven marketing strategies',
        location: 'Gurgaon, India',
        skills: ['SEO', 'Google Analytics', 'Content Marketing', 'Social Media'],
        experience: [],
        education: []
    },
    {
        name: 'Karan Mehta',
        email: 'karan.mehta@example.com',
        password: 'Password@123',
        headline: 'Cybersecurity Analyst',
        bio: 'Protecting digital assets and ensuring secure infrastructures',
        location: 'Chennai, India',
        skills: ['Penetration Testing', 'Network Security', 'SIEM', 'Compliance'],
        experience: [],
        education: []
    },
    {
        name: 'Sneha Patel',
        email: 'sneha.patel@example.com',
        password: 'Password@123',
        headline: 'Frontend Developer',
        bio: 'Crafting pixel-perfect and responsive web interfaces',
        location: 'Ahmedabad, India',
        skills: ['HTML', 'CSS', 'JavaScript', 'Vue.js'],
        experience: [],
        education: []
    },
    {
        name: 'Vivek Kumar',
        email: 'vivek.kumar@example.com',
        password: 'Password@123',
        headline: 'Cloud Architect',
        bio: 'Designing scalable cloud solutions on AWS and Azure',
        location: 'Bangalore, India',
        skills: ['AWS', 'Azure', 'Terraform', 'Cloud Security'],
        experience: [],
        education: []
    },
    {
        name: 'Neha Reddy',
        email: 'neha.reddy@example.com',
        password: 'Password@123',
        headline: 'Business Analyst',
        bio: 'Bridging the gap between business needs and technology solutions',
        location: 'Hyderabad, India',
        skills: ['Requirements Analysis', 'SQL', 'Tableau', 'Process Improvement'],
        experience: [],
        education: []
    },
    {
        name: 'Aditya Gupta',
        email: 'aditya.gupta@example.com',
        password: 'Password@123',
        headline: 'Game Developer',
        bio: 'Creating immersive gaming experiences with Unity and Unreal',
        location: 'Pune, India',
        skills: ['Unity', 'C#', 'Unreal Engine', '3D Modeling'],
        experience: [],
        education: []
    },
    {
        name: 'Riya Joshi',
        email: 'riya.joshi@example.com',
        password: 'Password@123',
        headline: 'HR Manager',
        bio: 'Building strong teams and fostering positive workplace culture',
        location: 'Mumbai, India',
        skills: ['Talent Acquisition', 'Employee Relations', 'Performance Management', 'HR Analytics'],
        experience: [],
        education: []
    },
    {
        name: 'Siddharth Kapoor',
        email: 'siddharth.kapoor@example.com',
        password: 'Password@123',
        headline: 'Blockchain Developer',
        bio: 'Building decentralized applications and smart contracts',
        location: 'Bangalore, India',
        skills: ['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts'],
        experience: [],
        education: []
    }
];

async function createUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub');
        console.log('Connected to MongoDB');

        for (const userData of sampleUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.name} already exists, skipping...`);
                continue;
            }

            const user = await User.create(userData);
            console.log(`✅ Created user: ${user.name}`);
        }

        console.log('\n🎉 All sample users created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating users:', error);
        process.exit(1);
    }
}

createUsers();
