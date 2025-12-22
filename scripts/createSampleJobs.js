require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const sampleCompanies = [
    {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        password: 'Password@123',
        role: 'company',
        companyInfo: {
            companyName: 'TechCorp Solutions',
            industry: 'Information Technology',
            companySize: '500-1000',
            website: 'https://techcorp.com',
            description: 'Leading technology solutions provider specializing in enterprise software'
        },
        location: 'Bangalore, India'
    },
    {
        name: 'DataMinds Analytics',
        email: 'careers@dataminds.com',
        password: 'Password@123',
        role: 'company',
        companyInfo: {
            companyName: 'DataMinds Analytics',
            industry: 'Data Science & AI',
            companySize: '100-500',
            website: 'https://dataminds.com',
            description: 'AI and machine learning solutions for modern businesses'
        },
        location: 'Hyderabad, India'
    },
    {
        name: 'CloudScale Systems',
        email: 'jobs@cloudscale.com',
        password: 'Password@123',
        role: 'company',
        companyInfo: {
            companyName: 'CloudScale Systems',
            industry: 'Cloud Computing',
            companySize: '200-500',
            website: 'https://cloudscale.com',
            description: 'Cloud infrastructure and DevOps solutions provider'
        },
        location: 'Pune, India'
    },
    {
        name: 'InnovateLabs',
        email: 'recruit@innovatelabs.com',
        password: 'Password@123',
        role: 'company',
        companyInfo: {
            companyName: 'InnovateLabs',
            industry: 'Product Development',
            companySize: '50-100',
            website: 'https://innovatelabs.com',
            description: 'Building next-generation SaaS products'
        },
        location: 'Mumbai, India'
    },
    {
        name: 'SecureNet Technologies',
        email: 'hiring@securenet.com',
        password: 'Password@123',
        role: 'company',
        companyInfo: {
            companyName: 'SecureNet Technologies',
            industry: 'Cybersecurity',
            companySize: '100-200',
            website: 'https://securenet.com',
            description: 'Enterprise cybersecurity and threat intelligence solutions'
        },
        location: 'Gurgaon, India'
    }
];

const jobTemplates = [
    {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.',
        requirements: ['5+ years of experience in web development', 'Strong knowledge of React and Node.js', 'Experience with MongoDB or PostgreSQL', 'Good understanding of RESTful APIs', 'Excellent problem-solving skills'],
        responsibilities: ['Design and develop scalable web applications', 'Write clean, maintainable code', 'Collaborate with cross-functional teams', 'Mentor junior developers', 'Participate in code reviews'],
        type: 'full-time',
        salary: { min: 1500000, max: 2500000, currency: 'INR' }
    },
    {
        title: 'DevOps Engineer',
        description: 'Join our DevOps team to build and maintain our cloud infrastructure. You will work with cutting-edge technologies to ensure high availability and scalability.',
        requirements: ['3+ years of DevOps experience', 'Strong knowledge of AWS/Azure', 'Experience with Docker and Kubernetes', 'Proficiency in CI/CD pipelines', 'Shell scripting skills'],
        responsibilities: ['Manage cloud infrastructure', 'Implement CI/CD pipelines', 'Monitor system performance', 'Automate deployment processes', 'Ensure security best practices'],
        type: 'full-time',
        salary: { min: 1200000, max: 2000000, currency: 'INR' }
    },
    {
        title: 'Data Scientist',
        description: 'We are seeking a talented Data Scientist to analyze complex datasets and build machine learning models that drive business decisions.',
        requirements: ['MS/PhD in Computer Science or related field', 'Strong Python and SQL skills', 'Experience with ML frameworks (TensorFlow, PyTorch)', 'Knowledge of statistical analysis', 'Good communication skills'],
        responsibilities: ['Build and deploy ML models', 'Analyze large datasets', 'Create data visualizations', 'Collaborate with product teams', 'Present findings to stakeholders'],
        type: 'full-time',
        salary: { min: 1800000, max: 3000000, currency: 'INR' }
    },
    {
        title: 'UI/UX Designer',
        description: 'Create beautiful and intuitive user interfaces for our products. Work closely with developers and product managers to deliver exceptional user experiences.',
        requirements: ['3+ years of UI/UX design experience', 'Proficiency in Figma/Adobe XD', 'Strong portfolio showcasing your work', 'Understanding of user-centered design', 'Excellent visual design skills'],
        responsibilities: ['Design user interfaces', 'Create wireframes and prototypes', 'Conduct user research', 'Collaborate with development team', 'Maintain design systems'],
        type: 'full-time',
        salary: { min: 1000000, max: 1800000, currency: 'INR' }
    },
    {
        title: 'Frontend Developer Intern',
        description: 'Learn and grow with our team as a Frontend Developer Intern. This is a great opportunity to work on real-world projects and gain valuable experience.',
        requirements: ['Currently pursuing a degree in Computer Science', 'Basic knowledge of HTML, CSS, JavaScript', 'Familiarity with React or Vue.js', 'Passion for learning', 'Good communication skills'],
        responsibilities: ['Develop frontend features', 'Write clean code', 'Learn from senior developers', 'Participate in team meetings', 'Complete assigned tasks'],
        type: 'internship',
        salary: { min: 20000, max: 30000, currency: 'INR' }
    },
    {
        title: 'Backend Developer',
        description: 'Build robust and scalable backend systems using modern technologies. Work with microservices architecture and cloud platforms.',
        requirements: ['3+ years of backend development experience', 'Strong knowledge of Node.js or Java', 'Experience with databases (SQL and NoSQL)', 'Understanding of API design', 'Problem-solving mindset'],
        responsibilities: ['Design and implement APIs', 'Optimize database queries', 'Write unit tests', 'Deploy services to cloud', 'Monitor application performance'],
        type: 'full-time',
        salary: { min: 1300000, max: 2200000, currency: 'INR' }
    },
    {
        title: 'Product Manager',
        description: 'Lead product strategy and roadmap for our flagship products. Work with engineering, design, and business teams to deliver value to customers.',
        requirements: ['5+ years of product management experience', 'Strong analytical skills', 'Experience with Agile methodologies', 'Excellent communication skills', 'Technical background preferred'],
        responsibilities: ['Define product vision', 'Create product roadmaps', 'Gather user feedback', 'Work with stakeholders', 'Measure product metrics'],
        type: 'full-time',
        salary: { min: 2000000, max: 3500000, currency: 'INR' }
    },
    {
        title: 'Cybersecurity Analyst',
        description: 'Protect our systems and data from security threats. Conduct security assessments and implement security best practices.',
        requirements: ['3+ years of cybersecurity experience', 'Knowledge of security frameworks', 'Experience with penetration testing', 'Understanding of compliance standards', 'Security certifications preferred'],
        responsibilities: ['Monitor security incidents', 'Conduct security audits', 'Implement security measures', 'Respond to threats', 'Train employees on security'],
        type: 'full-time',
        salary: { min: 1400000, max: 2300000, currency: 'INR' }
    }
];

async function createSampleJobs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub');
        console.log('Connected to MongoDB');

        // Create companies
        console.log('\n📊 Creating companies...');
        const companyIds = [];
        
        for (const companyData of sampleCompanies) {
            const existing = await User.findOne({ email: companyData.email });
            if (existing) {
                console.log(`Company ${companyData.companyInfo.companyName} already exists`);
                companyIds.push(existing._id);
                continue;
            }
            
            const company = await User.create(companyData);
            companyIds.push(company._id);
            console.log(`✅ Created company: ${company.companyInfo.companyName}`);
        }

        // Create jobs
        console.log('\n💼 Creating job postings...');
        let jobCount = 0;
        
        for (let i = 0; i < jobTemplates.length; i++) {
            const template = jobTemplates[i];
            const companyId = companyIds[i % companyIds.length];
            const company = await User.findById(companyId);
            
            const jobData = {
                ...template,
                company: company.companyInfo.companyName,
                location: company.location,
                postedBy: companyId,
                status: 'active',
                applications: []
            };
            
            const job = await Job.create(jobData);
            jobCount++;
            console.log(`✅ Created job: ${job.title} at ${job.company}`);
        }

        console.log(`\n🎉 Successfully created ${companyIds.length} companies and ${jobCount} jobs!`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createSampleJobs();
