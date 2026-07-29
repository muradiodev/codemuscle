import { PrismaClient } from "@prisma/client";
import { trainingProjects } from "@codemuscle/training-content";

const prisma = new PrismaClient();

const achievements = [
  ["first-file", "First complete file", "Completed a manual coding file."],
  ["first-project", "First complete project", "Completed every file in a practice project."],
  ["seven-day-streak", "Seven-day streak", "Practised for seven consecutive days."],
  ["accuracy-ten-files", "Precision streak", "Completed ten files at 98%+ token accuracy."],
  ["ten-files", "Ten files completed", "Finished ten practice files."],
  ["one-hour", "One hour of practice", "Accumulated one hour of active practice."],
  ["ten-hours", "Ten hours of practice", "Accumulated ten hours of active practice."],
  ["low-autocomplete", "Autocomplete independence", "Completed a file below 20% autocomplete dependency."],
  ["speed-best", "New speed best", "Set a personal speed record."],
  ["perfect-syntax", "Perfect syntax", "Completed a file with 100% token accuracy."]
] as const;

await prisma.language.upsert({ where: { id: "java" }, update: {}, create: { id: "java", name: "Java", enabled: true } });
await prisma.language.upsert({
  where: { id: "python" },
  update: { comingSoon: true, enabled: false },
  create: { id: "python", name: "Python", enabled: false, comingSoon: true }
});
const user = await prisma.userProfile.upsert({
  where: { id: "local-user" },
  update: {},
  create: { id: "local-user", settings: { create: {} } }
});

for (const item of achievements) {
  await prisma.achievement.upsert({
    where: { id: item[0] },
    update: { name: item[1], description: item[2] },
    create: { id: item[0], name: item[1], description: item[2] }
  });
}

for (const project of trainingProjects) {
  await prisma.trainingProject.upsert({
    where: { id: project.id },
    update: {
      name: project.name,
      description: project.description,
      version: project.version,
      difficulty: project.difficulty,
      order: project.order
    },
    create: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      description: project.description,
      languageId: "java",
      difficulty: project.difficulty,
      version: project.version,
      order: project.order
    }
  });
  for (const file of project.files) {
    await prisma.trainingFile.upsert({
      where: { id: file.id },
      update: {
        referenceCode: file.referenceCode,
        contentHash: file.contentHash,
        difficulty: file.difficulty,
        estimatedMinutes: file.estimatedMinutes,
        order: file.order,
        path: file.path,
        fileName: file.fileName
      },
      create: {
        id: file.id,
        projectId: project.id,
        path: file.path,
        fileName: file.fileName,
        referenceCode: file.referenceCode,
        contentHash: file.contentHash,
        difficulty: file.difficulty,
        estimatedMinutes: file.estimatedMinutes,
        order: file.order
      }
    });
    for (const slug of file.topics) {
      const topic = await prisma.topic.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name: slug.split("-").map((word) => word[0]!.toUpperCase() + word.slice(1)).join(" ")
        }
      });
      await prisma.trainingFileTopic.upsert({
        where: { fileId_topicId: { fileId: file.id, topicId: topic.id } },
        update: {},
        create: { fileId: file.id, topicId: topic.id }
      });
    }
  }
}

console.log(
  `Seeded profile ${user.id}, ${trainingProjects.length} projects, ${trainingProjects.flatMap((project) => project.files).length} files.`
);
await prisma.$disconnect();
