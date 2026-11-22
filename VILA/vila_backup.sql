--
-- PostgreSQL database dump
--

\restrict NxXgcLosP2TdOgr8fpC2AJz5cM1PdNXIvGeo9NqBgBEOOnq7szIv5AXDTcYYDlL

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-11-22 20:56:26

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 18686)
-- Name: auction_bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auction_bids (
    id integer NOT NULL,
    lot_id text NOT NULL,
    amount integer NOT NULL,
    bidder text,
    paddle text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 18685)
-- Name: auction_bids_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auction_bids_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 221
-- Name: auction_bids_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auction_bids_id_seq OWNED BY public.auction_bids.id;


--
-- TOC entry 224 (class 1259 OID 18700)
-- Name: auction_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auction_messages (
    id integer NOT NULL,
    lot_id text,
    user_name text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 18699)
-- Name: auction_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auction_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 223
-- Name: auction_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auction_messages_id_seq OWNED BY public.auction_messages.id;


--
-- TOC entry 220 (class 1259 OID 18670)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 219 (class 1259 OID 18669)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4868 (class 2604 OID 18689)
-- Name: auction_bids id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_bids ALTER COLUMN id SET DEFAULT nextval('public.auction_bids_id_seq'::regclass);


--
-- TOC entry 4870 (class 2604 OID 18703)
-- Name: auction_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_messages ALTER COLUMN id SET DEFAULT nextval('public.auction_messages_id_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 18673)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5030 (class 0 OID 18686)
-- Dependencies: 222
-- Data for Name: auction_bids; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auction_bids (id, lot_id, amount, bidder, paddle, created_at) FROM stdin;
1	104	2600	Test Paddle	#9999	2026-11-22 03:55:00.75811+08
2	104	2700	WS Tester	#1234	2026-11-22 03:55:05.899207+08
3	104	3700	Paddle #8492 (You)	#8492	2026-11-22 20:40:02.755789+08
\.


--
-- TOC entry 5032 (class 0 OID 18700)
-- Dependencies: 224
-- Data for Name: auction_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auction_messages (id, lot_id, user_name, message, created_at) FROM stdin;
1	104	Test User	This lot is gorgeous!	2026-11-22 03:55:00.805835+08
2	104	WS Tester	Testing realtime!	2026-11-22 03:55:05.901465+08
3	104	Paddle #8492 (You)	this looks good	2026-11-22 03:56:05.351888+08
\.


--
-- TOC entry 5028 (class 0 OID 18670)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, full_name, email, password_hash, created_at) FROM stdin;
3	dirk	dirkerolin@gmail.com	$2b$10$IVgSoxlcRNYnHvn1aYd3l.5xF.oAxpVKMf27G266tXo2Y9Qt4KI9y	2026-11-19 01:30:41.655525
\.


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 221
-- Name: auction_bids_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auction_bids_id_seq', 3, true);


--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 223
-- Name: auction_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auction_messages_id_seq', 3, true);


--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 4877 (class 2606 OID 18698)
-- Name: auction_bids auction_bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 18712)
-- Name: auction_messages auction_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_messages
    ADD CONSTRAINT auction_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 18684)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4875 (class 2606 OID 18682)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


-- Completed on 2026-11-22 20:56:26

--
-- PostgreSQL database dump complete
--

\unrestrict NxXgcLosP2TdOgr8fpC2AJz5cM1PdNXIvGeo9NqBgBEOOnq7szIv5AXDTcYYDlL

