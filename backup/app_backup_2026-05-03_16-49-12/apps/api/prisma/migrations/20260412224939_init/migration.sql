-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('LOCKED', 'OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChunkType" AS ENUM ('DEFINITION', 'EXPLANATION', 'EXAMPLE', 'ACTIVITY', 'NOTE', 'LAW');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'DRAG_DROP', 'ORDER', 'CLASSIFY', 'FILL_BLANK', 'MATCH', 'APPLY_LAW', 'INFERENCE', 'READ_TABLE', 'READ_GRAPH');

-- CreateEnum
CREATE TYPE "QuestionLevel" AS ENUM ('UNDERSTANDING', 'APPLICATION', 'REASONING');

-- CreateEnum
CREATE TYPE "QuestionVariant" AS ENUM ('PRIMARY', 'ALTERNATIVE', 'REMEDIAL', 'MASTERY');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_pages" (
    "id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "raw_text" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "source_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_nodes" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "introduction_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "unit_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'atom',
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_concepts" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "content_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "sub_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_chunks" (
    "id" TEXT NOT NULL,
    "text_ar" TEXT NOT NULL,
    "type" "ChunkType" NOT NULL DEFAULT 'EXPLANATION',
    "source_page_id" TEXT,
    "node_id" TEXT NOT NULL,
    "embedding" vector(768),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "content_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "source_page_id" TEXT,

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "figure_references" (
    "id" TEXT NOT NULL,
    "figure_number" INTEGER NOT NULL,
    "caption_ar" TEXT NOT NULL,
    "image_url" TEXT,
    "source_page_id" TEXT,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "figure_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_references" (
    "id" TEXT NOT NULL,
    "table_number" INTEGER NOT NULL,
    "caption_ar" TEXT NOT NULL,
    "data_json" JSONB NOT NULL,
    "source_page_id" TEXT,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "table_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worked_examples" (
    "id" TEXT NOT NULL,
    "problem_ar" TEXT NOT NULL,
    "solution_steps_json" JSONB NOT NULL,
    "node_id" TEXT NOT NULL,
    "source_page_id" TEXT,

    CONSTRAINT "worked_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "text_ar" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "level" "QuestionLevel" NOT NULL,
    "variant" "QuestionVariant" NOT NULL DEFAULT 'PRIMARY',
    "node_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "explanation_ar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "text_ar" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "explanation_ar" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "text_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost_points" INTEGER NOT NULL DEFAULT 2,
    "node_id" TEXT NOT NULL,
    "level" "QuestionLevel" NOT NULL,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remediation_cards" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "content_ar" TEXT NOT NULL,
    "level" "QuestionLevel" NOT NULL,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "remediation_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT,
    "text_answer" TEXT,
    "is_correct" BOOLEAN NOT NULL,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "time_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'LOCKED',
    "understanding_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "application_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasoning_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "hints_count" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "node_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery_snapshots" (
    "id" TEXT NOT NULL,
    "progress_id" TEXT NOT NULL,
    "mastery_score" DOUBLE PRECISION NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mastery_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'trophy',
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mini_game_definitions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "mini_game_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculator_templates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "formula_json" JSONB NOT NULL,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "calculator_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculator_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input_json" JSONB NOT NULL,
    "result_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculator_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "node_progress_user_id_node_id_key" ON "node_progress"("user_id", "node_id");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_pages" ADD CONSTRAINT "source_pages_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_nodes" ADD CONSTRAINT "concept_nodes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_nodes" ADD CONSTRAINT "concept_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "concept_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_concepts" ADD CONSTRAINT "sub_concepts_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_source_page_id_fkey" FOREIGN KEY ("source_page_id") REFERENCES "source_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_source_page_id_fkey" FOREIGN KEY ("source_page_id") REFERENCES "source_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "figure_references" ADD CONSTRAINT "figure_references_source_page_id_fkey" FOREIGN KEY ("source_page_id") REFERENCES "source_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "figure_references" ADD CONSTRAINT "figure_references_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_references" ADD CONSTRAINT "table_references_source_page_id_fkey" FOREIGN KEY ("source_page_id") REFERENCES "source_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_references" ADD CONSTRAINT "table_references_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worked_examples" ADD CONSTRAINT "worked_examples_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worked_examples" ADD CONSTRAINT "worked_examples_source_page_id_fkey" FOREIGN KEY ("source_page_id") REFERENCES "source_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remediation_cards" ADD CONSTRAINT "remediation_cards_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_progress" ADD CONSTRAINT "node_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_progress" ADD CONSTRAINT "node_progress_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mastery_snapshots" ADD CONSTRAINT "mastery_snapshots_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "node_progress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mini_game_definitions" ADD CONSTRAINT "mini_game_definitions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculator_templates" ADD CONSTRAINT "calculator_templates_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "concept_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculator_runs" ADD CONSTRAINT "calculator_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
