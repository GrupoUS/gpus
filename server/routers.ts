import { router } from './_core/trpc';
import { activitiesRouter, tasksRouter } from './routers/activities';
import { conversationsRouter, messagesRouter } from './routers/conversations';
import { enrollmentsRouter } from './routers/enrollments';
import { financialRouter } from './routers/financial';
import { leadsRouter } from './routers/leads';
import { lgpdRouter } from './routers/lgpd';
import { emailMarketingRouter, templatesRouter } from './routers/marketing';
import {
	customFieldsRouter,
	metricsRouter,
	notificationsRouter,
	settingsRouter,
	tagsRouter,
} from './routers/misc';
import { studentsRouter } from './routers/students';
import { usersRouter } from './routers/users';
import { whatsappRouter } from './routers/whatsapp';

export const appRouter = router({
	users: usersRouter,
	leads: leadsRouter,
	students: studentsRouter,
	enrollments: enrollmentsRouter,
	conversations: conversationsRouter,
	messages: messagesRouter,
	activities: activitiesRouter,
	tasks: tasksRouter,
	settings: settingsRouter,
	notifications: notificationsRouter,
	tags: tagsRouter,
	metrics: metricsRouter,
	customFields: customFieldsRouter,
	financial: financialRouter,
	templates: templatesRouter,
	emailMarketing: emailMarketingRouter,
	lgpd: lgpdRouter,
	whatsapp: whatsappRouter,
});

export type AppRouter = typeof appRouter;
