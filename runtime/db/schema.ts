import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const approvals=sqliteTable('approvals',{
  id:text('id').primaryKey(),token:text('token').notNull().unique(),payload:text('payload').notNull(),
  expiresAt:integer('expires_at').notNull(),orderSigned:text('order_signed'),poaSigned:text('poa_signed')
});
