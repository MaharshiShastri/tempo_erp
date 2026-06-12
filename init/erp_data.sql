--
-- PostgreSQL database dump
--

\restrict o3RfSg1Us9ju0xYzOkTiXKZOP20i6yxZyhXk6CmfxCwLtv4IwZNGrw51LkanSVf

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    log_id bigint NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100) NOT NULL,
    operator_email character varying(255),
    log_type character varying(50) DEFAULT 'COMMENT'::character varying,
    message text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_log_id_seq OWNER TO postgres;

--
-- Name: activity_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_log_id_seq OWNED BY public.activity_logs.log_id;


--
-- Name: bill_headers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bill_headers (
    bill_num character varying(50) NOT NULL,
    bill_date date NOT NULL,
    order_acceptance_id character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bill_headers OWNER TO postgres;

--
-- Name: bill_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bill_items (
    bill_item_id bigint NOT NULL,
    bill_num character varying(50),
    order_item_id bigint,
    quantity_shipped integer NOT NULL,
    CONSTRAINT bill_items_quantity_shipped_check CHECK ((quantity_shipped > 0))
);


ALTER TABLE public.bill_items OWNER TO postgres;

--
-- Name: bill_items_bill_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bill_items_bill_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bill_items_bill_item_id_seq OWNER TO postgres;

--
-- Name: bill_items_bill_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bill_items_bill_item_id_seq OWNED BY public.bill_items.bill_item_id;


--
-- Name: items_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items_master (
    item_code character varying(100) NOT NULL,
    item_name character varying(255) NOT NULL,
    item_group character varying(100),
    rate numeric(15,2) DEFAULT 0.00 NOT NULL,
    unit_measure character varying(20) DEFAULT 'NOS'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    additional_spec_text text,
    hsn_code character varying(20),
    revision_no character varying(50) DEFAULT ''::character varying
);


ALTER TABLE public.items_master OWNER TO postgres;

--
-- Name: logistics_fuel_matrix; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logistics_fuel_matrix (
    id integer NOT NULL,
    partner_id integer,
    fuel_price_from numeric(10,2),
    fuel_price_to numeric(10,2),
    surcharge_percentage numeric(5,2),
    sort_order integer DEFAULT 0
);


ALTER TABLE public.logistics_fuel_matrix OWNER TO postgres;

--
-- Name: logistics_fuel_matrix_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logistics_fuel_matrix_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logistics_fuel_matrix_id_seq OWNER TO postgres;

--
-- Name: logistics_fuel_matrix_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logistics_fuel_matrix_id_seq OWNED BY public.logistics_fuel_matrix.id;


--
-- Name: logistics_oda_matrix; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logistics_oda_matrix (
    id integer NOT NULL,
    partner_id integer,
    km_from numeric(10,2),
    km_to numeric(10,2),
    weight_from numeric(10,2),
    weight_to numeric(10,2),
    oda_charge numeric(10,2),
    sort_order integer DEFAULT 0
);


ALTER TABLE public.logistics_oda_matrix OWNER TO postgres;

--
-- Name: logistics_oda_matrix_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logistics_oda_matrix_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logistics_oda_matrix_id_seq OWNER TO postgres;

--
-- Name: logistics_oda_matrix_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logistics_oda_matrix_id_seq OWNED BY public.logistics_oda_matrix.id;


--
-- Name: logistics_partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logistics_partners (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    cft_factor numeric(10,2) DEFAULT 10,
    minimum_weight numeric(10,2) DEFAULT 0,
    minimum_freight_value numeric(10,2) DEFAULT 0,
    documentation_charge numeric(10,2) DEFAULT 0,
    fov_percentage numeric(5,2) DEFAULT 0,
    hawala_charges numeric(10,2) DEFAULT 0,
    gst_percentage numeric(5,2) DEFAULT 18
);


ALTER TABLE public.logistics_partners OWNER TO postgres;

--
-- Name: logistics_partners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logistics_partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logistics_partners_id_seq OWNER TO postgres;

--
-- Name: logistics_partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logistics_partners_id_seq OWNED BY public.logistics_partners.id;


--
-- Name: logistics_zone_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logistics_zone_rates (
    id integer NOT NULL,
    partner_id integer NOT NULL,
    source_zone character varying(10),
    destination_zone character varying(10),
    rate_per_kg numeric(10,2),
    sort_order integer DEFAULT 0
);


ALTER TABLE public.logistics_zone_rates OWNER TO postgres;

--
-- Name: logistics_zone_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logistics_zone_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logistics_zone_rates_id_seq OWNER TO postgres;

--
-- Name: logistics_zone_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logistics_zone_rates_id_seq OWNED BY public.logistics_zone_rates.id;


--
-- Name: logistics_zones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logistics_zones (
    id integer NOT NULL,
    partner_id integer NOT NULL,
    zone_code character varying(10) NOT NULL,
    zone_name character varying(255),
    states text[],
    sort_order integer DEFAULT 0
);


ALTER TABLE public.logistics_zones OWNER TO postgres;

--
-- Name: logistics_zones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logistics_zones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logistics_zones_id_seq OWNER TO postgres;

--
-- Name: logistics_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logistics_zones_id_seq OWNED BY public.logistics_zones.id;


--
-- Name: order_headers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_headers (
    order_acceptance_id character varying(50) NOT NULL,
    order_acceptance_date date NOT NULL,
    purchase_order_number character varying(100) NOT NULL,
    purchase_order_date date NOT NULL,
    customer_code character varying(50) NOT NULL,
    payment_terms character varying(100),
    billing_name character varying(255) NOT NULL,
    billing_address text NOT NULL,
    dispatched_through character varying(100),
    delivery_terms character varying(100),
    due_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_headers OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    order_item_id bigint NOT NULL,
    order_acceptance_id character varying(50),
    item_code character varying(50) NOT NULL,
    um character varying(10),
    additional_spec_text text,
    hsn_code character varying(8) NOT NULL,
    quantity integer NOT NULL,
    rate numeric(15,4) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0.00,
    amount numeric(15,2) GENERATED ALWAYS AS ((((quantity)::numeric * rate) * ((1)::numeric - (discount_percentage / 100.00)))) STORED,
    CONSTRAINT order_items_discount_percentage_check CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_rate_check CHECK ((rate >= (0)::numeric))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_order_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_order_item_id_seq OWNER TO postgres;

--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    details text,
    direction character varying(50),
    is_incomplete boolean DEFAULT true,
    assigned_by character varying(255),
    assigned_to text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(100) NOT NULL,
    dob date,
    phone_personal character varying(20),
    phone_business character varying(20),
    regions text[],
    department character varying(50) DEFAULT 'General'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: activity_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN log_id SET DEFAULT nextval('public.activity_logs_log_id_seq'::regclass);


--
-- Name: bill_items bill_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items ALTER COLUMN bill_item_id SET DEFAULT nextval('public.bill_items_bill_item_id_seq'::regclass);


--
-- Name: logistics_fuel_matrix id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_fuel_matrix ALTER COLUMN id SET DEFAULT nextval('public.logistics_fuel_matrix_id_seq'::regclass);


--
-- Name: logistics_oda_matrix id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_oda_matrix ALTER COLUMN id SET DEFAULT nextval('public.logistics_oda_matrix_id_seq'::regclass);


--
-- Name: logistics_partners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_partners ALTER COLUMN id SET DEFAULT nextval('public.logistics_partners_id_seq'::regclass);


--
-- Name: logistics_zone_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_zone_rates ALTER COLUMN id SET DEFAULT nextval('public.logistics_zone_rates_id_seq'::regclass);


--
-- Name: logistics_zones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_zones ALTER COLUMN id SET DEFAULT nextval('public.logistics_zones_id_seq'::regclass);


--
-- Name: order_items order_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (log_id, entity_type, entity_id, operator_email, log_type, message, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: bill_headers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bill_headers (bill_num, bill_date, order_acceptance_id, created_at) FROM stdin;
\.


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bill_items (bill_item_id, bill_num, order_item_id, quantity_shipped) FROM stdin;
\.


--
-- Data for Name: items_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items_master (item_code, item_name, item_group, rate, unit_measure, created_at, is_active, additional_spec_text, hsn_code, revision_no) FROM stdin;
TI - 710	DRY SHRINKAGE / STABILITY CHAMBER	Finished Goods	10000.00	in	2026-06-05 10:27:45.279049	t	\N	\N	
TI - 713	DRY SHRINKAGE / STABILITY CHAMBER	Finished Goods	10000.00	in	2026-06-05 10:29:27.679391	t	\N	\N	
TI-710	Walk in chamber	Flexotherm in Cements	500.00	in	2026-06-05 11:50:28.382022	t	\N	\N	
\.


--
-- Data for Name: logistics_fuel_matrix; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logistics_fuel_matrix (id, partner_id, fuel_price_from, fuel_price_to, surcharge_percentage, sort_order) FROM stdin;
10	1	81.00	84.00	10.00	0
\.


--
-- Data for Name: logistics_oda_matrix; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logistics_oda_matrix (id, partner_id, km_from, km_to, weight_from, weight_to, oda_charge, sort_order) FROM stdin;
12	1	0.00	51.00	0.00	51.00	750.00	0
13	1	0.00	51.00	51.00	250.00	900.00	0
14	1	51.00	75.00	0.00	51.00	1350.00	0
15	1	51.00	75.00	51.00	250.00	1800.00	0
\.


--
-- Data for Name: logistics_partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logistics_partners (id, name, cft_factor, minimum_weight, minimum_freight_value, documentation_charge, fov_percentage, hawala_charges, gst_percentage) FROM stdin;
1	V-Trans(India) Limited	10.00	100.00	1300.00	100.00	0.10	0.00	18.00
\.


--
-- Data for Name: logistics_zone_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logistics_zone_rates (id, partner_id, source_zone, destination_zone, rate_per_kg, sort_order) FROM stdin;
8	1	W1	CTL	9.50	0
\.


--
-- Data for Name: logistics_zones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logistics_zones (id, partner_id, zone_code, zone_name, states, sort_order) FROM stdin;
12	1	CTL	MP, Chattisgarh, Vidarbha (Nagpur & Surrounding)	{MP,Chattisgarh,Maharashtra}	0
13	1	E1	Kolkata	{"West Bengal"}	0
14	1	W1	Mumbai	{Maharashtra}	0
\.


--
-- Data for Name: order_headers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_headers (order_acceptance_id, order_acceptance_date, purchase_order_number, purchase_order_date, customer_code, payment_terms, billing_name, billing_address, dispatched_through, delivery_terms, due_date, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (order_item_id, order_acceptance_id, item_code, um, additional_spec_text, hsn_code, quantity, rate, discount_percentage) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, details, direction, is_incomplete, assigned_by, assigned_to, created_at) FROM stdin;
1	CNC	abc	dispatched	f	maharshi@tempoprecision.com	{maharshi@tempoprecision.com}	2026-06-03 11:57:22.652905
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (email, name, password_hash, role, dob, phone_personal, phone_business, regions, department) FROM stdin;
maharshi@tempoprecision.com	Maharshi Sanjay Shashtri	SecurePassword123	Chief Full Stack Developer	\N	\N	\N	\N	General
\.


--
-- Name: activity_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_log_id_seq', 1, false);


--
-- Name: bill_items_bill_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bill_items_bill_item_id_seq', 1, false);


--
-- Name: logistics_fuel_matrix_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logistics_fuel_matrix_id_seq', 10, true);


--
-- Name: logistics_oda_matrix_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logistics_oda_matrix_id_seq', 15, true);


--
-- Name: logistics_partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logistics_partners_id_seq', 1, true);


--
-- Name: logistics_zone_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logistics_zone_rates_id_seq', 8, true);


--
-- Name: logistics_zones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logistics_zones_id_seq', 14, true);


--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_order_item_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (log_id);


--
-- Name: bill_headers bill_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_headers
    ADD CONSTRAINT bill_headers_pkey PRIMARY KEY (bill_num);


--
-- Name: bill_items bill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_pkey PRIMARY KEY (bill_item_id);


--
-- Name: items_master items_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items_master
    ADD CONSTRAINT items_master_pkey PRIMARY KEY (item_code);


--
-- Name: logistics_fuel_matrix logistics_fuel_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_fuel_matrix
    ADD CONSTRAINT logistics_fuel_matrix_pkey PRIMARY KEY (id);


--
-- Name: logistics_oda_matrix logistics_oda_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_oda_matrix
    ADD CONSTRAINT logistics_oda_matrix_pkey PRIMARY KEY (id);


--
-- Name: logistics_partners logistics_partners_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_partners
    ADD CONSTRAINT logistics_partners_name_key UNIQUE (name);


--
-- Name: logistics_partners logistics_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_partners
    ADD CONSTRAINT logistics_partners_pkey PRIMARY KEY (id);


--
-- Name: logistics_zone_rates logistics_zone_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_zone_rates
    ADD CONSTRAINT logistics_zone_rates_pkey PRIMARY KEY (id);


--
-- Name: logistics_zones logistics_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_zones
    ADD CONSTRAINT logistics_zones_pkey PRIMARY KEY (id);


--
-- Name: order_headers order_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_headers
    ADD CONSTRAINT order_headers_pkey PRIMARY KEY (order_acceptance_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (email);


--
-- Name: idx_activity_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_entity ON public.activity_logs USING btree (entity_type, entity_id);


--
-- Name: activity_logs activity_logs_operator_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_operator_email_fkey FOREIGN KEY (operator_email) REFERENCES public.users(email) ON DELETE SET NULL;


--
-- Name: bill_headers bill_headers_order_acceptance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_headers
    ADD CONSTRAINT bill_headers_order_acceptance_id_fkey FOREIGN KEY (order_acceptance_id) REFERENCES public.order_headers(order_acceptance_id);


--
-- Name: bill_items bill_items_bill_num_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_bill_num_fkey FOREIGN KEY (bill_num) REFERENCES public.bill_headers(bill_num) ON DELETE CASCADE;


--
-- Name: bill_items bill_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id);


--
-- Name: logistics_fuel_matrix logistics_fuel_matrix_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_fuel_matrix
    ADD CONSTRAINT logistics_fuel_matrix_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.logistics_partners(id);


--
-- Name: logistics_oda_matrix logistics_oda_matrix_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_oda_matrix
    ADD CONSTRAINT logistics_oda_matrix_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.logistics_partners(id);


--
-- Name: logistics_zone_rates logistics_zone_rates_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_zone_rates
    ADD CONSTRAINT logistics_zone_rates_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.logistics_partners(id);


--
-- Name: logistics_zones logistics_zones_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logistics_zones
    ADD CONSTRAINT logistics_zones_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.logistics_partners(id);


--
-- Name: order_items order_items_order_acceptance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_acceptance_id_fkey FOREIGN KEY (order_acceptance_id) REFERENCES public.order_headers(order_acceptance_id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(email);


--
-- PostgreSQL database dump complete
--

\unrestrict o3RfSg1Us9ju0xYzOkTiXKZOP20i6yxZyhXk6CmfxCwLtv4IwZNGrw51LkanSVf

