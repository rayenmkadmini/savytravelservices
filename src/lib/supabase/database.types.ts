
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "articles": {
                  Row: {
                    "body": Json | null,"cover_image_url": string | null,"created_at": string,"destination_id": string | null,"excerpt": Json | null,"id": string,"image_credit": string | null,"is_published": boolean,"published_at": string | null,"slug": string,"title": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "body"?: Json | null,"cover_image_url"?: string | null,"created_at"?: string,"destination_id"?: string | null,"excerpt"?: Json | null,"id"?: string,"image_credit"?: string | null,"is_published"?: boolean,"published_at"?: string | null,"slug": string,"title": NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "body"?: Json | null,"cover_image_url"?: string | null,"created_at"?: string,"destination_id"?: string | null,"excerpt"?: Json | null,"id"?: string,"image_credit"?: string | null,"is_published"?: boolean,"published_at"?: string | null,"slug"?: string,"title"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    }
                  ]
                },"booking_documents": {
                  Row: {
                    "booking_id": string | null,"created_at": string,"file_name": string,"id": string,"kind": string,"mime_type": string,"size_bytes": number,"storage_path": string,"user_id": string,"visa_request_id": string | null
                  }
                  Insert: {
                    "booking_id"?: string | null,"created_at"?: string,"file_name": string,"id"?: string,"kind"?: string,"mime_type": string,"size_bytes": number,"storage_path": string,"user_id": string,"visa_request_id"?: string | null
                  }
                  Update: {
                    "booking_id"?: string | null,"created_at"?: string,"file_name"?: string,"id"?: string,"kind"?: string,"mime_type"?: string,"size_bytes"?: number,"storage_path"?: string,"user_id"?: string,"visa_request_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_documents_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "booking_documents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "booking_documents_visa_request_id_fkey"
      columns: ["visa_request_id"]
isOneToOne: false
      referencedRelation: "visa_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"booking_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"booking_id": string | null,"created_at": string,"id": string,"visa_request_id": string | null
                  }
                  Insert: {
                    "author_id"?: string | null,"body": string,"booking_id"?: string | null,"created_at"?: string,"id"?: string,"visa_request_id"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"booking_id"?: string | null,"created_at"?: string,"id"?: string,"visa_request_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "booking_notes_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "booking_notes_visa_fk"
      columns: ["visa_request_id"]
isOneToOne: false
      referencedRelation: "visa_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"booking_passengers": {
                  Row: {
                    "booking_id": string,"created_at": string,"date_of_birth": string | null,"full_name": string,"id": string,"nationality": string | null,"passenger_type": Database["public"]['Enums']["passenger_type"],"passport_expiry": string | null,"passport_number": string | null
                  }
                  Insert: {
                    "booking_id": string,"created_at"?: string,"date_of_birth"?: string | null,"full_name": string,"id"?: string,"nationality"?: string | null,"passenger_type"?: Database["public"]['Enums']["passenger_type"],"passport_expiry"?: string | null,"passport_number"?: string | null
                  }
                  Update: {
                    "booking_id"?: string,"created_at"?: string,"date_of_birth"?: string | null,"full_name"?: string,"id"?: string,"nationality"?: string | null,"passenger_type"?: Database["public"]['Enums']["passenger_type"],"passport_expiry"?: string | null,"passport_number"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_passengers_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"booking_status_history": {
                  Row: {
                    "booking_id": string,"changed_by": string | null,"created_at": string,"from_status": Database["public"]['Enums']["booking_status"] | null,"id": string,"note": string | null,"to_status": Database["public"]['Enums']["booking_status"]
                  }
                  Insert: {
                    "booking_id": string,"changed_by"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["booking_status"] | null,"id"?: string,"note"?: string | null,"to_status": Database["public"]['Enums']["booking_status"]
                  }
                  Update: {
                    "booking_id"?: string,"changed_by"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["booking_status"] | null,"id"?: string,"note"?: string | null,"to_status"?: Database["public"]['Enums']["booking_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_status_history_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "booking_status_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "adults": number,"budget": number | null,"budget_currency": Database["public"]['Enums']["currency_code"] | null,"cancelled_at": string | null,"children": number,"confirmed_at": string | null,"contact_email": string,"contact_name": string,"contact_phone": string,"created_at": string,"customer_message": string | null,"departure_date": string | null,"destination": string | null,"destination_id": string | null,"hotel_id": string | null,"id": string,"infants": number,"locale": Database["public"]['Enums']["app_locale"],"notes": string | null,"origin": string | null,"package_id": string | null,"payment_status": Database["public"]['Enums']["payment_state"],"quoted_amount": number | null,"quoted_currency": Database["public"]['Enums']["currency_code"],"reference": string,"return_date": string | null,"room_id": string | null,"rooms": number | null,"service_type": Database["public"]['Enums']["service_type"],"status": Database["public"]['Enums']["booking_status"],"travel_class": Database["public"]['Enums']["travel_class"] | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "adults"?: number,"budget"?: number | null,"budget_currency"?: Database["public"]['Enums']["currency_code"] | null,"cancelled_at"?: string | null,"children"?: number,"confirmed_at"?: string | null,"contact_email": string,"contact_name": string,"contact_phone": string,"created_at"?: string,"customer_message"?: string | null,"departure_date"?: string | null,"destination"?: string | null,"destination_id"?: string | null,"hotel_id"?: string | null,"id"?: string,"infants"?: number,"locale"?: Database["public"]['Enums']["app_locale"],"notes"?: string | null,"origin"?: string | null,"package_id"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_state"],"quoted_amount"?: number | null,"quoted_currency"?: Database["public"]['Enums']["currency_code"],"reference"?: string,"return_date"?: string | null,"room_id"?: string | null,"rooms"?: number | null,"service_type": Database["public"]['Enums']["service_type"],"status"?: Database["public"]['Enums']["booking_status"],"travel_class"?: Database["public"]['Enums']["travel_class"] | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "adults"?: number,"budget"?: number | null,"budget_currency"?: Database["public"]['Enums']["currency_code"] | null,"cancelled_at"?: string | null,"children"?: number,"confirmed_at"?: string | null,"contact_email"?: string,"contact_name"?: string,"contact_phone"?: string,"created_at"?: string,"customer_message"?: string | null,"departure_date"?: string | null,"destination"?: string | null,"destination_id"?: string | null,"hotel_id"?: string | null,"id"?: string,"infants"?: number,"locale"?: Database["public"]['Enums']["app_locale"],"notes"?: string | null,"origin"?: string | null,"package_id"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_state"],"quoted_amount"?: number | null,"quoted_currency"?: Database["public"]['Enums']["currency_code"],"reference"?: string,"return_date"?: string | null,"room_id"?: string | null,"rooms"?: number | null,"service_type"?: Database["public"]['Enums']["service_type"],"status"?: Database["public"]['Enums']["booking_status"],"travel_class"?: Database["public"]['Enums']["travel_class"] | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_hotel_id_fkey"
      columns: ["hotel_id"]
isOneToOne: false
      referencedRelation: "hotels"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_package_id_fkey"
      columns: ["package_id"]
isOneToOne: false
      referencedRelation: "travel_packages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_room_id_fkey"
      columns: ["room_id"]
isOneToOne: false
      referencedRelation: "hotel_rooms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contact_messages": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"id": string,"locale": Database["public"]['Enums']["app_locale"],"message": string,"phone": string | null,"status": string,"subject": string | null,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"full_name": string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"message": string,"phone"?: string | null,"status"?: string,"subject"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"message"?: string,"phone"?: string | null,"status"?: string,"subject"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contact_messages_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"destinations": {
                  Row: {
                    "country": NonNullable<Json>,"created_at": string,"description": Json | null,"id": string,"image_credit": string | null,"image_url": string | null,"is_featured": boolean,"is_published": boolean,"name": NonNullable<Json>,"region": string,"slug": string,"sort_order": number,"tagline": Json | null,"updated_at": string
                  }
                  Insert: {
                    "country": NonNullable<Json>,"created_at"?: string,"description"?: Json | null,"id"?: string,"image_credit"?: string | null,"image_url"?: string | null,"is_featured"?: boolean,"is_published"?: boolean,"name": NonNullable<Json>,"region"?: string,"slug": string,"sort_order"?: number,"tagline"?: Json | null,"updated_at"?: string
                  }
                  Update: {
                    "country"?: NonNullable<Json>,"created_at"?: string,"description"?: Json | null,"id"?: string,"image_credit"?: string | null,"image_url"?: string | null,"is_featured"?: boolean,"is_published"?: boolean,"name"?: NonNullable<Json>,"region"?: string,"slug"?: string,"sort_order"?: number,"tagline"?: Json | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"exchange_rates": {
                  Row: {
                    "currency": Database["public"]['Enums']["currency_code"],"fetched_at": string,"source": string,"tnd_per_unit": number,"updated_by": string | null
                  }
                  Insert: {
                    "currency": Database["public"]['Enums']["currency_code"],"fetched_at"?: string,"source": string,"tnd_per_unit": number,"updated_by"?: string | null
                  }
                  Update: {
                    "currency"?: Database["public"]['Enums']["currency_code"],"fetched_at"?: string,"source"?: string,"tnd_per_unit"?: number,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "exchange_rates_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"hotel_rooms": {
                  Row: {
                    "board": string,"created_at": string,"description": Json | null,"hotel_id": string,"id": string,"is_published": boolean,"max_adults": number,"max_children": number,"name": NonNullable<Json>,"price_from": number | null,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "board"?: string,"created_at"?: string,"description"?: Json | null,"hotel_id": string,"id"?: string,"is_published"?: boolean,"max_adults"?: number,"max_children"?: number,"name": NonNullable<Json>,"price_from"?: number | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "board"?: string,"created_at"?: string,"description"?: Json | null,"hotel_id"?: string,"id"?: string,"is_published"?: boolean,"max_adults"?: number,"max_children"?: number,"name"?: NonNullable<Json>,"price_from"?: number | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hotel_rooms_hotel_id_fkey"
      columns: ["hotel_id"]
isOneToOne: false
      referencedRelation: "hotels"
      referencedColumns: ["id"]
    }
                  ]
                },"hotels": {
                  Row: {
                    "address": string | null,"amenities": (string)[],"city": string,"cover_image_url": string | null,"created_at": string,"currency": Database["public"]['Enums']["currency_code"],"description": Json | null,"destination_id": string | null,"gallery": (string)[],"id": string,"is_featured": boolean,"is_published": boolean,"name": string,"price_from": number | null,"slug": string,"sort_order": number,"stars": number | null,"updated_at": string
                  }
                  Insert: {
                    "address"?: string | null,"amenities"?: (string)[],"city": string,"cover_image_url"?: string | null,"created_at"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"description"?: Json | null,"destination_id"?: string | null,"gallery"?: (string)[],"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"name": string,"price_from"?: number | null,"slug": string,"sort_order"?: number,"stars"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"amenities"?: (string)[],"city"?: string,"cover_image_url"?: string | null,"created_at"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"description"?: Json | null,"destination_id"?: string | null,"gallery"?: (string)[],"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"name"?: string,"price_from"?: number | null,"slug"?: string,"sort_order"?: number,"stars"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hotels_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    }
                  ]
                },"newsletter_subscribers": {
                  Row: {
                    "email": string,"id": string,"locale": Database["public"]['Enums']["app_locale"],"source": string,"status": string,"subscribed_at": string,"unsubscribe_token": string,"unsubscribed_at": string | null
                  }
                  Insert: {
                    "email": string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"source"?: string,"status"?: string,"subscribed_at"?: string,"unsubscribe_token"?: string,"unsubscribed_at"?: string | null
                  }
                  Update: {
                    "email"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"source"?: string,"status"?: string,"subscribed_at"?: string,"unsubscribe_token"?: string,"unsubscribed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"link": string | null,"payload": NonNullable<Json>,"read_at": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"link"?: string | null,"payload"?: NonNullable<Json>,"read_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"link"?: string | null,"payload"?: NonNullable<Json>,"read_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"package_images": {
                  Row: {
                    "alt": Json | null,"created_at": string,"id": string,"package_id": string,"sort_order": number,"url": string
                  }
                  Insert: {
                    "alt"?: Json | null,"created_at"?: string,"id"?: string,"package_id": string,"sort_order"?: number,"url": string
                  }
                  Update: {
                    "alt"?: Json | null,"created_at"?: string,"id"?: string,"package_id"?: string,"sort_order"?: number,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "package_images_package_id_fkey"
      columns: ["package_id"]
isOneToOne: false
      referencedRelation: "travel_packages"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"booking_id": string,"created_at": string,"created_by": string | null,"currency": Database["public"]['Enums']["currency_code"],"id": string,"note": string | null,"payment_url": string | null,"provider": Database["public"]['Enums']["payment_provider"],"provider_payload": Json | null,"provider_payment_id": string | null,"status": Database["public"]['Enums']["payment_record_status"],"updated_at": string,"verified_at": string | null
                  }
                  Insert: {
                    "amount": number,"booking_id": string,"created_at"?: string,"created_by"?: string | null,"currency"?: Database["public"]['Enums']["currency_code"],"id"?: string,"note"?: string | null,"payment_url"?: string | null,"provider": Database["public"]['Enums']["payment_provider"],"provider_payload"?: Json | null,"provider_payment_id"?: string | null,"status"?: Database["public"]['Enums']["payment_record_status"],"updated_at"?: string,"verified_at"?: string | null
                  }
                  Update: {
                    "amount"?: number,"booking_id"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: Database["public"]['Enums']["currency_code"],"id"?: string,"note"?: string | null,"payment_url"?: string | null,"provider"?: Database["public"]['Enums']["payment_provider"],"provider_payload"?: Json | null,"provider_payment_id"?: string | null,"status"?: Database["public"]['Enums']["payment_record_status"],"updated_at"?: string,"verified_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"date_of_birth": string | null,"email": string,"full_name": string,"id": string,"nationality": string | null,"phone": string | null,"preferred_locale": Database["public"]['Enums']["app_locale"],"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"date_of_birth"?: string | null,"email": string,"full_name"?: string,"id": string,"nationality"?: string | null,"phone"?: string | null,"preferred_locale"?: Database["public"]['Enums']["app_locale"],"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"date_of_birth"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"nationality"?: string | null,"phone"?: string | null,"preferred_locale"?: Database["public"]['Enums']["app_locale"],"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_role_fkey"
      columns: ["role"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                },"roles": {
                  Row: {
                    "description": string,"id": Database["public"]['Enums']["user_role"],"label": string
                  }
                  Insert: {
                    "description": string,"id": Database["public"]['Enums']["user_role"],"label": string
                  }
                  Update: {
                    "description"?: string,"id"?: Database["public"]['Enums']["user_role"],"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"team_members": {
                  Row: {
                    "bio": Json | null,"created_at": string,"full_name": string,"id": string,"is_published": boolean,"photo_url": string | null,"position": NonNullable<Json>,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "bio"?: Json | null,"created_at"?: string,"full_name": string,"id"?: string,"is_published"?: boolean,"photo_url"?: string | null,"position": NonNullable<Json>,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "bio"?: Json | null,"created_at"?: string,"full_name"?: string,"id"?: string,"is_published"?: boolean,"photo_url"?: string | null,"position"?: NonNullable<Json>,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "author_location": string | null,"author_name": string,"content": string,"created_at": string,"id": string,"is_published": boolean,"locale": Database["public"]['Enums']["app_locale"],"rating": number,"sort_order": number,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "author_location"?: string | null,"author_name": string,"content": string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"locale"?: Database["public"]['Enums']["app_locale"],"rating": number,"sort_order"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "author_location"?: string | null,"author_name"?: string,"content"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"locale"?: Database["public"]['Enums']["app_locale"],"rating"?: number,"sort_order"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"travel_packages": {
                  Row: {
                    "category": string,"cover_image_url": string | null,"created_at": string,"currency": Database["public"]['Enums']["currency_code"],"description": Json | null,"destination_id": string | null,"duration_days": number,"duration_nights": number,"excluded": Json | null,"id": string,"image_credit": string | null,"included": Json | null,"is_featured": boolean,"is_published": boolean,"itinerary": NonNullable<Json>,"max_travelers": number | null,"price_from": number | null,"slug": string,"sort_order": number,"summary": Json | null,"title": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "category"?: string,"cover_image_url"?: string | null,"created_at"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"description"?: Json | null,"destination_id"?: string | null,"duration_days": number,"duration_nights": number,"excluded"?: Json | null,"id"?: string,"image_credit"?: string | null,"included"?: Json | null,"is_featured"?: boolean,"is_published"?: boolean,"itinerary"?: NonNullable<Json>,"max_travelers"?: number | null,"price_from"?: number | null,"slug": string,"sort_order"?: number,"summary"?: Json | null,"title": NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"cover_image_url"?: string | null,"created_at"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"description"?: Json | null,"destination_id"?: string | null,"duration_days"?: number,"duration_nights"?: number,"excluded"?: Json | null,"id"?: string,"image_credit"?: string | null,"included"?: Json | null,"is_featured"?: boolean,"is_published"?: boolean,"itinerary"?: NonNullable<Json>,"max_travelers"?: number | null,"price_from"?: number | null,"slug"?: string,"sort_order"?: number,"summary"?: Json | null,"title"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "travel_packages_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    }
                  ]
                },"visa_countries": {
                  Row: {
                    "created_at": string,"id": string,"image_url": string | null,"is_published": boolean,"iso_code": string,"name": NonNullable<Json>,"overview": Json | null,"slug": string,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_url"?: string | null,"is_published"?: boolean,"iso_code": string,"name": NonNullable<Json>,"overview"?: Json | null,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_url"?: string | null,"is_published"?: boolean,"iso_code"?: string,"name"?: NonNullable<Json>,"overview"?: Json | null,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"visa_requests": {
                  Row: {
                    "category": string,"contact_email": string,"contact_name": string,"contact_phone": string,"country_id": string | null,"created_at": string,"customer_message": string | null,"destination_country": string,"id": string,"locale": Database["public"]['Enums']["app_locale"],"message": string | null,"nationality": string,"reference": string,"service_fee": number | null,"status": Database["public"]['Enums']["visa_request_status"],"travel_date": string | null,"travelers": number,"updated_at": string,"user_id": string,"visa_type_id": string | null
                  }
                  Insert: {
                    "category"?: string,"contact_email": string,"contact_name": string,"contact_phone": string,"country_id"?: string | null,"created_at"?: string,"customer_message"?: string | null,"destination_country": string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"message"?: string | null,"nationality": string,"reference"?: string,"service_fee"?: number | null,"status"?: Database["public"]['Enums']["visa_request_status"],"travel_date"?: string | null,"travelers"?: number,"updated_at"?: string,"user_id": string,"visa_type_id"?: string | null
                  }
                  Update: {
                    "category"?: string,"contact_email"?: string,"contact_name"?: string,"contact_phone"?: string,"country_id"?: string | null,"created_at"?: string,"customer_message"?: string | null,"destination_country"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"message"?: string | null,"nationality"?: string,"reference"?: string,"service_fee"?: number | null,"status"?: Database["public"]['Enums']["visa_request_status"],"travel_date"?: string | null,"travelers"?: number,"updated_at"?: string,"user_id"?: string,"visa_type_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "visa_requests_country_id_fkey"
      columns: ["country_id"]
isOneToOne: false
      referencedRelation: "visa_countries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visa_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visa_requests_visa_type_id_fkey"
      columns: ["visa_type_id"]
isOneToOne: false
      referencedRelation: "visa_types"
      referencedColumns: ["id"]
    }
                  ]
                },"visa_types": {
                  Row: {
                    "category": string,"country_id": string,"created_at": string,"description": Json | null,"fee_info": Json | null,"id": string,"is_published": boolean,"name": NonNullable<Json>,"processing_time": Json | null,"required_documents": Json | null,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "category"?: string,"country_id": string,"created_at"?: string,"description"?: Json | null,"fee_info"?: Json | null,"id"?: string,"is_published"?: boolean,"name": NonNullable<Json>,"processing_time"?: Json | null,"required_documents"?: Json | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"country_id"?: string,"created_at"?: string,"description"?: Json | null,"fee_info"?: Json | null,"id"?: string,"is_published"?: boolean,"name"?: NonNullable<Json>,"processing_time"?: Json | null,"required_documents"?: Json | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visa_types_country_id_fkey"
      columns: ["country_id"]
isOneToOne: false
      referencedRelation: "visa_countries"
      referencedColumns: ["id"]
    }
                  ]
                },"website_settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "website_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_dashboard_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"booking_transition_allowed":
{ Args: { "from_status": Database["public"]['Enums']["booking_status"],"to_status": Database["public"]['Enums']["booking_status"] }; Returns: boolean
                           },
"cancel_my_booking":
{ Args: { "booking_reference": string }; Returns: undefined
                           },
"cancel_my_visa_request":
{ Args: { "request_reference": string }; Returns: undefined
                           },
"current_user_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"grant_role":
{ Args: { "new_role": Database["public"]['Enums']["user_role"],"target_email": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_i18n":
{ Args: { "required"?: boolean,"value": Json }; Returns: boolean
                           },
"is_privileged_context":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_super_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"next_reference":
{ Args: { "prefix": string,"seq": unknown }; Returns: string
                           },
"subscribe_newsletter":
{ Args: { "subscriber_email": string,"subscriber_locale"?: Database["public"]['Enums']["app_locale"] }; Returns: undefined
                           },
"sync_booking_payment_status":
{ Args: { "target_booking": string }; Returns: undefined
                           },
"unsubscribe_newsletter":
{ Args: { "token": string }; Returns: boolean
                           }
          }
          Enums: {
            "app_locale": "fr"|"en"|"ar","booking_status": "pending"|"under_review"|"confirmed"|"rejected"|"cancelled","currency_code": "TND"|"EUR"|"USD","passenger_type": "adult"|"child"|"infant","payment_provider": "konnect"|"flouci"|"bank_transfer"|"cash","payment_record_status": "pending"|"completed"|"failed"|"cancelled"|"refunded","payment_state": "unpaid"|"awaiting_payment"|"partially_paid"|"paid"|"refunded","service_type": "flight"|"hotel"|"package"|"tour"|"business"|"custom","travel_class": "economy"|"premium_economy"|"business"|"first","user_role": "super_admin"|"admin"|"customer","visa_request_status": "pending"|"under_review"|"documents_requested"|"submitted"|"completed"|"cancelled"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_locale": ["fr", "en", "ar"],"booking_status": ["pending", "under_review", "confirmed", "rejected", "cancelled"],"currency_code": ["TND", "EUR", "USD"],"passenger_type": ["adult", "child", "infant"],"payment_provider": ["konnect", "flouci", "bank_transfer", "cash"],"payment_record_status": ["pending", "completed", "failed", "cancelled", "refunded"],"payment_state": ["unpaid", "awaiting_payment", "partially_paid", "paid", "refunded"],"service_type": ["flight", "hotel", "package", "tour", "business", "custom"],"travel_class": ["economy", "premium_economy", "business", "first"],"user_role": ["super_admin", "admin", "customer"],"visa_request_status": ["pending", "under_review", "documents_requested", "submitted", "completed", "cancelled"]
          }
        }
} as const

