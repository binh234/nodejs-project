const Joi = require("joi");
const express = require('express');
const app = express();
app.use(express.json());

const courses = [
    { id: 1, name: 'course1' },
    { id: 2, name: 'course2' },
    { id: 3, name: 'course3' },
    { id: 4, name: 'course4' },
];

app.get("/", (request, response) => {
    response.send("Hello world");
})

app.post("/api/courses", (request, response) => {
    // Validate data
    const { error } = validateCourse(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message);
    }

    let course = {
        id: courses.length + 1,
        name: request.body.name
    };
    courses.push(course);
    response.send(course);
})

app.get("/api/courses", (request, response) => {
    response.send(courses);
})

app.get("/api/courses/:id", (request, response) => {
    // Lookup for the course
    let course = courses.find(c => c.id === parseInt(request.params.id));
    if (!course) {
        return response.status(404).send("The course with the given id is not found!!!");
    }
    response.send(course);
})

app.put("/api/courses/:id", (request, response) => {
    // Lookup for the course
    let course = courses.find(c => c.id === parseInt(request.params.id));
    if (!course) {
        return response.status(404).send("The course with the given id is not found!!!");
    }

    // Validate data
    const { error } = validateCourse(request.body); // Extract request.error
    if (error) {
        return response.status(400).send(error.details[0].message);
    }

    // Update course
    course.name = request.body.name;
    response.send(course);
})

app.delete("/api/courses/:id", (request, response) => {
    // Lookup for the course
    let course = courses.find(c => c.id === parseInt(request.params.id));
    if (!course) {
        return response.status(404).send("The course with the given id is not found!!!");
    }

    // Delete course
    const index = courses.indexOf(course);
    courses.splice(index, 1);
    response.send(course);
})

function validateCourse(course) {
    // Validate data
    const schema = Joi.object({
        name: Joi.string().min(3).required()
    });
    return schema.validate(course);
}


const port = process.env.PORT || 3000;
app.listen(3000, () => {
    {
        console.log(`listening on port ${port}...`);
    }
})