export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      book_chapters: {
        Row: {
          chapter_number: number
          created_at: string
          id: string
          module_id: string
          summary: string
          title: string
          total_verses: number | null
          updated_at: string
        }
        Insert: {
          chapter_number: number
          created_at?: string
          id?: string
          module_id: string
          summary?: string
          title?: string
          total_verses?: number | null
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          id?: string
          module_id?: string
          summary?: string
          title?: string
          total_verses?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      book_introductions: {
        Row: {
          academic_notes: string
          audience: string
          authorship: string
          canon_relation: string
          central_theme: string
          christ_connection: string
          created_at: string
          cultural_context: string
          dating: string
          geography: string
          historical_context: string
          id: string
          main_characters: string
          module_id: string
          name_meaning: string
          original_name: string
          purpose: string
          status: Database["public"]["Enums"]["content_status"]
          structure: string
          updated_at: string
        }
        Insert: {
          academic_notes?: string
          audience?: string
          authorship?: string
          canon_relation?: string
          central_theme?: string
          christ_connection?: string
          created_at?: string
          cultural_context?: string
          dating?: string
          geography?: string
          historical_context?: string
          id?: string
          main_characters?: string
          module_id: string
          name_meaning?: string
          original_name?: string
          purpose?: string
          status?: Database["public"]["Enums"]["content_status"]
          structure?: string
          updated_at?: string
        }
        Update: {
          academic_notes?: string
          audience?: string
          authorship?: string
          canon_relation?: string
          central_theme?: string
          christ_connection?: string
          created_at?: string
          cultural_context?: string
          dating?: string
          geography?: string
          historical_context?: string
          id?: string
          main_characters?: string
          module_id?: string
          name_meaning?: string
          original_name?: string
          purpose?: string
          status?: Database["public"]["Enums"]["content_status"]
          structure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_introductions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          code: string
          course_id: string
          created_at: string
          id: string
          issued_at: string
          student_name: string | null
          user_id: string
        }
        Insert: {
          code?: string
          course_id: string
          created_at?: string
          id?: string
          issued_at?: string
          student_name?: string | null
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          student_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_sources: {
        Row: {
          author: string
          created_at: string
          detail: string
          id: string
          kind: string
          lesson_id: string | null
          module_id: string | null
          order_index: number
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          author?: string
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          lesson_id?: string | null
          module_id?: string | null
          order_index?: number
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          author?: string
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          lesson_id?: string | null
          module_id?: string | null
          order_index?: number
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_sources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          book_number: number | null
          category: string | null
          course_id: string
          created_at: string
          id: string
          is_published: boolean
          module_kind: string
          order_index: number
          phase: number | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          testament: string | null
          title: string
          updated_at: string
        }
        Insert: {
          book_number?: number | null
          category?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_published?: boolean
          module_kind?: string
          order_index?: number
          phase?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          testament?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          book_number?: number | null
          category?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_published?: boolean
          module_kind?: string
          order_index?: number
          phase?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          testament?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          completed_lessons: number
          course_id: string
          created_at: string
          id: string
          last_lesson_id: string | null
          started_at: string
          total_lessons: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_lessons?: number
          course_id: string
          created_at?: string
          id?: string
          last_lesson_id?: string | null
          started_at?: string
          total_lessons?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: number
          course_id?: string
          created_at?: string
          id?: string
          last_lesson_id?: string | null
          started_at?: string
          total_lessons?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_last_lesson_id_fkey"
            columns: ["last_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["course_level"]
          order_index: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          tier: Database["public"]["Enums"]["access_tier"]
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          order_index?: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          tier?: Database["public"]["Enums"]["access_tier"]
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          order_index?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          tier?: Database["public"]["Enums"]["access_tier"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          content: Json
          created_at: string
          day: string
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          day: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          day?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_submissions: {
        Row: {
          answers: Json
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "lesson_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          content: string | null
          created_at: string
          id: string
          kind: string
          reference: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          reference: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          reference?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          slug: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          kind: string
          slug: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          slug?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          contextual_note: string
          created_at: string
          definition: string
          id: string
          kind: string
          language: string
          original_term: string
          scripture_refs: string[]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          term: string
          transliteration: string
          updated_at: string
        }
        Insert: {
          contextual_note?: string
          created_at?: string
          definition?: string
          id?: string
          kind?: string
          language?: string
          original_term?: string
          scripture_refs?: string[]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          term: string
          transliteration?: string
          updated_at?: string
        }
        Update: {
          contextual_note?: string
          created_at?: string
          definition?: string
          id?: string
          kind?: string
          language?: string
          original_term?: string
          scripture_refs?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          term?: string
          transliteration?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          progress: number
          target: number
          title: string
          unit: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          target?: number
          title: string
          unit?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          target?: number
          title?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_days: {
        Row: {
          day: string
          habits: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          day: string
          habits?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          habits?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          answered: boolean
          content: string
          created_at: string
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          answered?: boolean
          content?: string
          created_at?: string
          id?: string
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          answered?: boolean
          content?: string
          created_at?: string
          id?: string
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_answers: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_correct: boolean | null
          lesson_id: string
          question_id: string
          response: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean | null
          lesson_id: string
          question_id: string
          response?: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean | null
          lesson_id?: string
          question_id?: string
          response?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_answers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_content: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          lesson_id: string
          order_index: number
          scripture_refs: string[]
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          lesson_id: string
          order_index?: number
          scripture_refs?: string[]
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          lesson_id?: string
          order_index?: number
          scripture_refs?: string[]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_cross_references: {
        Row: {
          created_at: string
          explanation: string
          id: string
          lesson_id: string
          order_index: number
          reference: string
          relation_kind: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string
          id?: string
          lesson_id: string
          order_index?: number
          reference: string
          relation_kind?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string
          id?: string
          lesson_id?: string
          order_index?: number
          reference?: string
          relation_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_cross_references_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_exercises: {
        Row: {
          created_at: string
          fields: Json
          id: string
          instructions: string
          kind: string
          lesson_id: string
          order_index: number
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          instructions?: string
          kind?: string
          lesson_id: string
          order_index?: number
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          instructions?: string
          kind?: string
          lesson_id?: string
          order_index?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_glossary_terms: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          term_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          order_index?: number
          term_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_glossary_terms_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_glossary_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_media: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          kind: string
          language: string
          lesson_id: string
          order_index: number
          provider: string
          source: string
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string | null
          transcript: string | null
          updated_at: string
          url: string
          voice: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          kind?: string
          language?: string
          lesson_id: string
          order_index?: number
          provider?: string
          source?: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
          url: string
          voice?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          kind?: string
          language?: string
          lesson_id?: string
          order_index?: number
          provider?: string
          source?: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
          url?: string
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_media_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          audio_chunk_index: number
          audio_position_seconds: number
          completed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          last_section_index: number
          lesson_id: string
          notes: string
          playback_rate: number
          read_percent: number
          reflection: string
          seconds_watched: number
          status: Database["public"]["Enums"]["lesson_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_chunk_index?: number
          audio_position_seconds?: number
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          last_section_index?: number
          lesson_id: string
          notes?: string
          playback_rate?: number
          read_percent?: number
          reflection?: string
          seconds_watched?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_chunk_index?: number
          audio_position_seconds?: number
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          last_section_index?: number
          lesson_id?: string
          notes?: string
          playback_rate?: number
          read_percent?: number
          reflection?: string
          seconds_watched?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          answer_key: string | null
          created_at: string
          explanation: string | null
          id: string
          kind: string
          lesson_id: string
          options: Json
          order_index: number
          prompt: string
          scripture_refs: string[]
          updated_at: string
        }
        Insert: {
          answer_key?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          kind?: string
          lesson_id: string
          options?: Json
          order_index?: number
          prompt: string
          scripture_refs?: string[]
          updated_at?: string
        }
        Update: {
          answer_key?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          kind?: string
          lesson_id?: string
          options?: Json
          order_index?: number
          prompt?: string
          scripture_refs?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reflections: {
        Row: {
          created_at: string
          exercise_response: string
          id: string
          lesson_id: string
          meditation: string
          prayer_reflection: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_response?: string
          id?: string
          lesson_id: string
          meditation?: string
          prayer_reflection?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_response?: string
          id?: string
          lesson_id?: string
          meditation?: string
          prayer_reflection?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reflections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          chapter_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          is_published: boolean
          keywords: string[]
          module_id: string
          order_index: number
          passage: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          tier: Database["public"]["Enums"]["access_tier"]
          title: string
          tts_script: string | null
          updated_at: string
          verse_end: number | null
          verse_start: number | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          keywords?: string[]
          module_id: string
          order_index?: number
          passage?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          tier?: Database["public"]["Enums"]["access_tier"]
          title: string
          tts_script?: string | null
          updated_at?: string
          verse_end?: number | null
          verse_start?: number | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          keywords?: string[]
          module_id?: string
          order_index?: number
          passage?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          tier?: Database["public"]["Enums"]["access_tier"]
          title?: string
          tts_script?: string | null
          updated_at?: string
          verse_end?: number | null
          verse_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_progress: {
        Row: {
          completed_days: number[]
          id: string
          notes: Json
          plan_slug: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_days?: number[]
          id?: string
          notes?: Json
          plan_slug: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_days?: number[]
          id?: string
          notes?: Json
          plan_slug?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_seen_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_seen_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      sermon_messages: {
        Row: {
          application: string
          conclusion: string
          course_id: string | null
          created_at: string
          id: string
          introduction: string
          lesson_id: string | null
          notes: string
          objective: string
          points: Json
          scripture_text: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application?: string
          conclusion?: string
          course_id?: string | null
          created_at?: string
          id?: string
          introduction?: string
          lesson_id?: string | null
          notes?: string
          objective?: string
          points?: Json
          scripture_text?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application?: string
          conclusion?: string
          course_id?: string | null
          created_at?: string
          id?: string
          introduction?: string
          lesson_id?: string | null
          notes?: string
          objective?: string
          points?: Json
          scripture_text?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sermon_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_progress: {
        Row: {
          audio_chunk_index: number
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_section_index: number
          playback_rate: number
          read_percent: number
          study_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_chunk_index?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_section_index?: number
          playback_rate?: number
          read_percent?: number
          study_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_chunk_index?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_section_index?: number
          playback_rate?: number
          read_percent?: number
          study_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          tier: Database["public"]["Enums"]["access_tier"]
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          slug: string
          tier?: Database["public"]["Enums"]["access_tier"]
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          tier?: Database["public"]["Enums"]["access_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      track_progress: {
        Row: {
          checkpoints: Json
          completed_steps: number[]
          id: string
          reviews: Json
          started_at: string
          track_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checkpoints?: Json
          completed_steps?: number[]
          id?: string
          reviews?: Json
          started_at?: string
          track_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checkpoints?: Json
          completed_steps?: number[]
          id?: string
          reviews?: Json
          started_at?: string
          track_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          challenge_type: string
          created_at: string
          daily_goal: string | null
          interests: string[]
          onboarding_completed: boolean
          reading_minutes: number
          reminder_paused_until: string | null
          reminder_repeat: string
          reminder_time: string
          reminders_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          daily_goal?: string | null
          interests?: string[]
          onboarding_completed?: boolean
          reading_minutes?: number
          reminder_paused_until?: string | null
          reminder_repeat?: string
          reminder_time?: string
          reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          daily_goal?: string | null
          interests?: string[]
          onboarding_completed?: boolean
          reading_minutes?: number
          reminder_paused_until?: string | null
          reminder_repeat?: string
          reminder_time?: string
          reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string | null
          provider: string | null
          provider_ref: string | null
          status: string
          tier: Database["public"]["Enums"]["access_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["access_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["access_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_premium: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      issue_course_certificate: {
        Args: { _course_id: string }
        Returns: {
          code: string
          course_id: string
          created_at: string
          id: string
          issued_at: string
          student_name: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      access_tier: "free" | "premium"
      app_role: "admin" | "user"
      content_status: "draft" | "published" | "archived"
      course_level: "iniciante" | "intermediario" | "avancado" | "profundo"
      lesson_status: "nao_iniciada" | "em_andamento" | "concluida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_tier: ["free", "premium"],
      app_role: ["admin", "user"],
      content_status: ["draft", "published", "archived"],
      course_level: ["iniciante", "intermediario", "avancado", "profundo"],
      lesson_status: ["nao_iniciada", "em_andamento", "concluida"],
    },
  },
} as const
