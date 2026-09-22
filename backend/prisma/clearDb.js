// Prisma database scripts and utilities.
// Performs initial data loading, migrations, or database maintenance.

import "dotenv/config";
import prisma from "../config/prisma.js";

// Function to handle clearAll operations
async function clearAll() {
  console.log("Deleting all data from all tables...");
  await prisma.invoice.deleteMany();
  await prisma.ticketReply.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contactSubmission.deleteMany();
  await prisma.user.deleteMany();

  const userCount = await prisma.user.count();
  const projectCount = await prisma.project.count();
  const taskCount = await prisma.task.count();
  console.log("Users:", userCount, "| Projects:", projectCount, "| Tasks:", taskCount);
  console.log("Database is now empty.");
  await prisma.$disconnect();
}

clearAll();
