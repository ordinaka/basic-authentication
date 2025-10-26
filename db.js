import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;   
dotenv.config();


export const pool = new Pool({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
})