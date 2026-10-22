import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_ieee_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_paper():
    doc = docx.Document()

    # Section 1: Title and Author (Single Column)
    s1 = doc.sections[0]
    s1.top_margin = Inches(0.75)
    s1.bottom_margin = Inches(0.75)
    s1.left_margin = Inches(0.75)
    s1.right_margin = Inches(0.75)

    # Base Normal Style
    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(10)
    normal.font.color.rgb = RGBColor(0, 0, 0)
    normal.paragraph_format.line_spacing = 1.05
    normal.paragraph_format.space_after = Pt(3)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(10)
    r_title = p_title.add_run(
        "TreeConnect: A Multi-Stakeholder Digital Agroforestry Framework "
        "with Tree Modelling and Retrieval-Augmented Valuation"
    )
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(20)
    r_title.font.bold = True

    # Author Block
    p_auth = doc.add_paragraph()
    p_auth.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_auth.paragraph_format.space_after = Pt(14)
    
    r_name = p_auth.add_run("Harigovind D Nair\n")
    r_name.font.size = Pt(11)
    r_name.font.bold = True

    r_dept = p_auth.add_run(
        "Department of Computer Applications\n"
        "Amal Jyothi College of Engineering\n"
        "Kerala, India\n"
    )
    r_dept.font.size = Pt(10)

    r_email = p_auth.add_run("Email: harigovind.dnair@gmail.com")
    r_email.font.size = Pt(10)

    # Section 2: Two Columns (Abstract through References)
    s2 = doc.add_section(WD_SECTION.CONTINUOUS)
    s2.top_margin = Inches(0.75)
    s2.bottom_margin = Inches(0.75)
    s2.left_margin = Inches(0.75)
    s2.right_margin = Inches(0.75)

    sectPr = s2._sectPr
    cols = sectPr.xpath('./w:cols')
    if cols:
        cols[0].set(qn('w:num'), '2')
        cols[0].set(qn('w:space'), '360') # 0.25 in
    else:
        cols_node = parse_xml(f'<w:cols {nsdecls("w")} w:num="2" w:space="360"/>')
        sectPr.append(cols_node)

    # Helpers
    def add_sec(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(9)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.bold = True
        return p

    def add_subsec(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.italic = True
        return p

    def add_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        return p

    def add_eq(text, num):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.italic = True
        r.font.size = Pt(10)
        r2 = p.add_run(f"    ({num})")
        r2.font.name = 'Times New Roman'
        r2.font.bold = True
        return p

    # Abstract
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.space_after = Pt(4)
    r1 = p_abs.add_run("Abstract—")
    r1.bold = True
    r1.italic = True
    r2 = p_abs.add_run(
        "Conventional timber trading and harvest management environments generally organize commercial transactions around "
        "predefined or informal networks of local intermediaries, unstandardized wood appraisals, and fragmented operational logistics. "
        "Although this approach provides local familiarity, it does not necessarily account for differences in tree species, volumetric "
        "yield, market rates, and landowner requirements. Digital technology and automated informatics have enabled the development of "
        "structured agroforestry approaches that use tree- and parcel-related information to support transparent timber supply chain experiences. "
        "Existing research has examined tree inventory modelling, harvest logistics scheduling, timber valuation, contractor assessment, and "
        "supply chain analytics as individual or partially integrated mechanisms.\n"
        "This paper presents TreeConnect, a multi-stakeholder digital agroforestry framework designed to integrate tree inventory modelling, "
        "structured harvest operational workflows, contractor on-site assessments, platform analytics, and Retrieval-Augmented dynamic timber "
        "valuation. The proposed framework maintains tree- and property-related performance information and uses this information to support "
        "subsequent harvesting, negotiation, and settlement decisions. In addition, the valuation engine retrieves relevant information from "
        "authorized forestry department market schedules before generating commercial estimates, providing a mechanism for grounding pricing "
        "assistance in region-specific market material.\n"
        "The paper presents the conceptual architecture, harvest operations workflow, valuation pipeline, research methodology, and evaluation "
        "framework of the proposed system. Instead of assuming operational improvement before experimentation, the study defines measurable "
        "criteria for evaluating volumetric accuracy, assessment adaptation, rate retrieval quality, commercial quotation grounding, stakeholder "
        "engagement, and operational gain. The proposed framework provides a basis for investigating how multiple digital forestry capabilities "
        "can be integrated into a continuous sustainable harvest management process."
    )
    r2.font.size = Pt(9.5)

    # Index Terms
    p_idx = doc.add_paragraph()
    p_idx.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_idx.paragraph_format.space_after = Pt(8)
    r3 = p_idx.add_run("Index Terms—")
    r3.bold = True
    r3.italic = True
    r4 = p_idx.add_run("agroforestry, timber supply chain, tree modelling, harvest operations, automated valuation, retrieval-augmented generation, milestone escrow payments, forestry analytics")
    r4.font.size = Pt(9.5)
    r4.italic = True

    # I. INTRODUCTION
    add_sec("I. INTRODUCTION")
    add_p(
        "Digital agriculture and forestry platforms have expanded access to commercial resources through online registries, electronic inventory "
        "catalogues, automated logging assessments, and interactive trading environments. However, the availability of digital tools does not "
        "necessarily mean that every landowner or contractor receives an operational experience suited to their current level of farm timber yield "
        "and harvesting requirements."
    )
    add_p(
        "Landowners entering the timber market may differ in standing species, tree dimensions, parcel accessibility, commercial awareness, and "
        "harvesting requirements. A fixed or informal intermediary network can therefore provide suboptimal valuation to tree owners whose actual "
        "harvesting and timber profiles are vastly different. Modern agroforestry informatics attempts to address this limitation by using information "
        "about individual trees and parcels to modify aspects of the commercial harvest process."
    )
    add_p(
        "Digital technology and computational modeling have been increasingly investigated as a mechanism for supporting transparent and equitable "
        "forestry operations. Research has examined tree inventory estimation, contractor scheduling, predictive market analytics, and intelligent "
        "matching as approaches for coordinating decentralized timber supply chains [1]–[3]. A systematic mapping study categorized digital forestry "
        "approaches across tree inventory modeling, operational logistics, valuation systems, automated site assessment, and predictive supply chain analytics [2]."
    )
    add_p(
        "Meta-analytic research has also investigated the relationship between digital supply chain coordination and producer outcomes. Wang et al. "
        "analysed studies conducted between 2010 and 2022 and evaluated the efficacy of digital agro-market platforms across grower economic outcomes [4]. "
        "Similarly, research on automated resource management systems has investigated their relationship with operational outcomes across rural supply contexts [5]."
    )
    add_p(
        "Despite this progress, agroforestry harvest management remains a multidimensional problem. A system that inventories trees based on landowner inputs "
        "does not necessarily provide adaptive field assessment, contractor equipment allocation, milestone escrow clearing, or continuous supply chain "
        "analytics. The literature reviewed for this study identifies a limited integration of tree assessment, continuous harvest operations monitoring, "
        "transparent price recommendation, and contractor mediation within a single digital platform."
    )
    add_p(
        "Data-driven valuation models introduce another opportunity for forestry platforms by enabling dynamic price calculation. However, a general-purpose "
        "valuation function may generate estimates that are not specifically aligned with the statutory schedule rates and local market realities used in a "
        "particular geographic district."
    )
    add_p(
        "Retrieval-Augmented Valuation provides a mechanism for combining external information retrieval with algorithmic estimation [6]. Instead of relying "
        "entirely on static heuristics encoded within the software, relevant market information can be retrieved from an external statutory knowledge source "
        "(such as government timber price schedules) and supplied as context during commercial quote generation. Recent research has specifically examined the "
        "use of retrieval-grounded systems in agricultural and natural resource decision support [7]."
    )
    add_p(
        "The central motivation of this research is therefore not simply to add digital listing features to a timber website, but to investigate how tree "
        "modelling, operational harvest coordination, on-site assessment, analytics, and retrieval-grounded valuation assistance can operate as a connected "
        "management cycle."
    )
    add_p("This paper proposes TreeConnect, a multi-stakeholder digital agroforestry framework designed around this integration.")
    add_p("The primary contributions of the proposed research are:")

    p_c1 = doc.add_paragraph()
    p_c1.paragraph_format.left_indent = Inches(0.2)
    p_c1.paragraph_format.space_after = Pt(2)
    p_c1.add_run("1) A unified architecture ").bold = True
    p_c1.add_run("connecting landowner tree inventory, harvest operational workflows, contractor site assessments, analytics, and milestone-secured financial clearing.")

    p_c2 = doc.add_paragraph()
    p_c2.paragraph_format.left_indent = Inches(0.2)
    p_c2.paragraph_format.space_after = Pt(2)
    p_c2.add_run("2) A tree-modelling approach ").bold = True
    p_c2.add_run("in which dendrometric measurements, parcel accessibility, and inventory records contribute to subsequent harvesting and pricing decisions.")

    p_c3 = doc.add_paragraph()
    p_c3.paragraph_format.left_indent = Inches(0.2)
    p_c3.paragraph_format.space_after = Pt(2)
    p_c3.add_run("3) A retrieval-augmented valuation workflow ").bold = True
    p_c3.add_run("designed to retrieve relevant price schedules from regional forestry market resources before generating commercial quotations.")

    p_c4 = doc.add_paragraph()
    p_c4.paragraph_format.left_indent = Inches(0.2)
    p_c4.paragraph_format.space_after = Pt(4)
    p_c4.add_run("4) An evaluation framework ").bold = True
    p_c4.add_run("that separates technical platform performance from economic outcome claims and defines measurable criteria for future empirical evaluation.")

    # II. BACKGROUND
    add_sec("II. BACKGROUND")
    add_subsec("A. Agroforestry Harvest Management")
    add_p(
        "Agroforestry harvest management refers to operational environments in which tree felling, yard extraction, log cross-cutting, and commercial "
        "trading are coordinated according to information about the standing trees and property parcel. Coordination may involve tree selection, "
        "felling difficulty assessment, contractor matching, safety appraisal, or the sequence in which operational milestones are executed."
    )
    add_p(
        "Digital agroforestry research has investigated multiple approaches for representing tree characteristics and selecting appropriate harvesting "
        "resources. Gligorea et al. identified database modeling, decision support algorithms, recommendation systems, and predictive analytics as "
        "important techniques within agricultural and resource management systems [1]."
    )
    add_p(
        "Recent work has also examined digital forestry platforms from the perspective of system architecture, cloud implementation, field evaluation, "
        "and practical deployment [8]."
    )
    add_p(
        "The literature suggests that harvest management should not be reduced to passive timber listing alone. A more complete operational process "
        "requires a direct relationship between tree inventory state, field inspection evidence, contractor allocation, and commercial settlement."
    )

    add_subsec("B. Tree Modelling")
    add_p(
        "A tree model represents information about an individual standing tree or parcel inventory that can be used by an operational harvest platform.\n"
        "For TreeConnect, the tree state can be represented conceptually as:"
    )
    add_eq("T_i = {S_i, G_i, H_i, V_i, Q_i, L_i, C_i}", "1")
    add_p(
        "where:\n"
        "• S_i represents the botanical and commercial species (e.g., Teak, Rosewood, Mahogany, Rubberwood),\n"
        "• G_i represents the girth at breast height (GBH, 1.37 m),\n"
        "• H_i represents merchantable bole height,\n"
        "• V_i represents estimated commercial timber volume (m^3),\n"
        "• Q_i represents timber grade or biological health state,\n"
        "• L_i represents parcel geospatial coordinates and terrain classification, and\n"
        "• C_i represents completed verification media (geo-tagged photos).\n"
        "The proposed representation is modular. Different implementations may use different dendrometric techniques to estimate volume and quality."
    )

    add_subsec("C. Contractor Field Assessment")
    add_p(
        "Contractor inspection systems have an established history within forestry and logging operations. Such systems attempt to provide standardized "
        "operational planning using information about physical tree condition, property hazards, and extraction terrain [9]."
    )
    add_p(
        "A meta-analysis by Ma et al. investigated the relationship between structured assessment protocols and operational performance across multiple "
        "field studies [5]. These findings provide background for considering contractor inspection as one critical component of a broader harvest management environment."
    )
    add_p(
        "In TreeConnect, contractor inspection assistance is treated as a supporting verification component rather than an informal, unrecorded transaction."
    )

    add_subsec("D. Retrieval-Augmented Valuation")
    add_p(
        "Retrieval-Augmented Valuation combines reference market rate retrieval with algorithmic price computation [6]. A simplified retrieval workflow "
        "can be expressed as:"
    )
    add_eq("D = R(q, K)", "2")
    add_p(
        "where q represents the property and species query, K represents the indexed statutory knowledge base of forestry market rates, R represents the "
        "retrieval operation, and D represents the retrieved price context."
    )
    add_p("The generated commercial quotation can then be represented as:")
    add_eq("a = G(q, D)", "3")
    add_p(
        "where G represents the quotation generation process and a represents the resulting commercial proposal.\n"
        "For TreeConnect, the knowledge base is intended to contain district-specific timber market reference schedules supplied by authorized forestry "
        "administrators. Recent research on domain-specific retrieval systems has examined its use across agricultural applications and identified "
        "retrieval, pricing models, contextual grounding, and evaluation as important components of the process [7]."
    )
    add_p(
        "Rate retrieval should not be considered an absolute guarantee of transaction finality. Inaccurate field entry, incomplete market schedules, "
        "or extreme terrain difficulties may still necessitate manual adjustment. Therefore, quotation grounding and retrieval accuracy should be evaluated independently."
    )

    # III. RELATED WORK
    add_sec("III. RELATED WORK")
    add_p(
        "Gligorea et al. conducted a literature review of digital transformation in natural resource systems and identified inventory modeling, "
        "recommendation systems, machine learning, and predictive analytics as important mechanisms for operational efficiency [1]."
    )
    add_p(
        "Kabudi et al. conducted a systematic mapping study of AI- and informatics-enabled resource management research and classified existing work "
        "across physical asset modelling, operational coordination, automated assessment, and predictive analytics [2]."
    )
    add_p(
        "Wang et al. conducted a meta-analysis of digital agricultural market systems using studies published between 2010 and 2022 [4]. Their work "
        "provides empirical synthesis concerning the relationship between digital supply chain integration and producer outcomes."
    )
    add_p(
        "Meylani examined contemporary research on digital agroforestry systems through a systematic review and qualitative synthesis [10]. The study "
        "highlights continuing challenges associated with the practical and responsible application of informatics in decentralized rural trade."
    )
    add_p(
        "Research on computational intelligence in forestry has also identified several application areas, including tree health assessment, yield "
        "prediction, supply chain optimization, and contractor dispatch [3]."
    )
    add_p(
        "Logging inspection systems have been studied independently for many years. Alkhatlan and Kalita reviewed the development of field inspection "
        "support systems and their technological evolution [9]. Ma et al. provided a meta-analysis examining outcomes associated with structured "
        "operational workflows [5]."
    )
    add_p(
        "Supply chain analytics provides another relevant research direction. Siemens and Long described operational analytics as a means of using "
        "stakeholder-related data to understand and optimize production processes [11]. Ifenthaler and Yau further examined the use of analytics for "
        "supporting operational success and administrative decision-making [12]."
    )
    add_p(
        "Recent work has extended these directions toward retrieval-grounded decision models. RAG research in agricultural informatics has investigated "
        "the use of retrieved statutory knowledge to support automated estimations [7]. Research on human-centred systems and operational analytics has "
        "also emphasized considerations such as human control, trust, reliability, data security, and stakeholder involvement [13]."
    )
    add_p(
        "Although these research directions provide substantial individual contributions, the focus of TreeConnect is their integration into a single "
        "agroforestry harvest workflow."
    )

    # IV. RESEARCH GAP
    add_sec("IV. RESEARCH GAP")
    add_p(
        "The reviewed literature indicates several areas that motivate the proposed research.\n"
        "First, digital forestry is frequently implemented through passive classified listings without necessarily providing a complete operational harvest cycle.\n"
        "Second, tree inventory modeling, contractor field inspection, commercial assessment, and supply chain analytics are often treated as distinct capabilities.\n"
        "Third, general-purpose valuation calculators introduce a risk that generated price estimates may not correspond directly to the specific statutory schedules used in a district.\n"
        "Fourth, although retrieval mechanisms provide a basis for grounding valuation using external market schedules, their integration with tree-specific operational adaptation remains an area requiring further investigation [6], [7]."
    )
    add_p(
        "The research gap addressed by this study can therefore be formulated as the need for an integrated harvest management environment in which:\n"
        "1) tree inventory measurements contribute to a persistent tree model;\n"
        "2) the tree model influences subsequent harvesting, inspection, and assessment decisions;\n"
        "3) assessment results provide feedback to the operational adaptation process;\n"
        "4) platform analytics provides evidence about harvest progress; and\n"
        "5) system-generated commercial quotations are grounded in retrieved reference market resources.\n"
        "This integration-oriented gap is consistent with the limitations identified in the literature review prepared for this research."
    )

    # V. PROPOSED TREECONNECT FRAMEWORK
    add_sec("V. PROPOSED TREECONNECT FRAMEWORK")
    add_p(
        "TreeConnect is proposed as an integrated agroforestry harvest management environment rather than a collection of independent tools.\n"
        "The framework contains five principal components:\n"
        "1) Tree Inventory Model\n"
        "2) Harvest Operational Engine\n"
        "3) Assessment Engine\n"
        "4) Retrieval-Augmented Valuation Engine\n"
        "5) Supply Chain Analytics and Feedback\n"
        "These components form a feedback cycle. Landowner tree registrations generate inventory records, the records update the tree model, the updated model "
        "influences contractor matching and inspection scheduling, and completed assessments generate additional operational evidence."
    )

    # TABLE I
    p_t1 = doc.add_paragraph()
    p_t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1.paragraph_format.space_before = Pt(6)
    p_t1.paragraph_format.space_after = Pt(2)
    r_t1 = p_t1.add_run("TABLE I\nFUNCTIONAL COMPONENTS OF TREECONNECT")
    r_t1.bold = True
    r_t1.font.size = Pt(8.5)

    table1 = doc.add_table(rows=6, cols=2)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_ieee_table_borders(table1)

    t1_headers = ["Component", "Primary Function"]
    for i, h in enumerate(t1_headers):
        cell = table1.cell(0, i)
        cell.text = h
        set_cell_background(cell, "F2F2F2")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(8.5)

    t1_data = [
        ("Tree Inventory Model", "Maintains property parcels, tree species, dendrometric measures (GBH, height), and visual health status."),
        ("Harvest Operations Engine", "Uses tree-state information to coordinate contractor assignment, inspection scheduling, and operational transitions."),
        ("Assessment Engine", "Provides on-site inspection checklists and records contractor proposals, risk evaluations, and itemized quotations."),
        ("RAG Valuation Engine", "Retrieves relevant forestry department rate schedules and uses retrieved context to support automated timber valuations."),
        ("Analytics", "Summarizes operational progress and provides information that can support stakeholder and administrative decisions.")
    ]

    for row_idx, (comp, desc) in enumerate(t1_data, start=1):
        c0 = table1.cell(row_idx, 0)
        c1 = table1.cell(row_idx, 1)
        c0.text = comp
        c1.text = desc
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(8.5)
        c1.paragraphs[0].runs[0].font.size = Pt(8.5)

    # VI. SYSTEM ARCHITECTURE
    add_sec("VI. SYSTEM ARCHITECTURE")
    add_p(
        "The conceptual architecture of TreeConnect is organized into four logical layers:\n"
        "1) Presentation Layer\n"
        "2) Application and Workflow Layer\n"
        "3) Computational and Retrieval Layer\n"
        "4) Data Layer\n"
        "The presentation layer provides access to property inventory, harvest requests, inspection checklists, commercial proposals, progress dashboards, and valuation tools.\n"
        "The application layer manages user profiles, property registrations, assessment scheduling, and state-machine transitions."
    )
    add_p(
        "The computational and retrieval layer manages rate schedule retrieval and market-grounded quotation generation.\n"
        "The data layer stores tree information, parcel geometries, assessment records, and operational activity data."
    )

    # Fig 1 Flow representation (matching Mentora Fig 1 format)
    p_fig = doc.add_paragraph()
    p_fig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fig.paragraph_format.space_before = Pt(4)
    p_fig.paragraph_format.space_after = Pt(2)
    r_fig = p_fig.add_run(
        "TreeConnect Harvest Architecture\n"
        "Landowner / User\n"
        "↓\n"
        "Operational Interface\n"
        "↓\n"
        "Tree Inventory Model\n"
        "↔\n"
        "Harvest Operations Engine\n"
        "↓\n"
        "Harvest Content / Assessment\n"
        "↓\n"
        "Operational Feedback\n"
        "Forestry Market Schedules\n"
        "→ Document Processing → Retrieval Index → Relevant Context → Valuation Engine → Stakeholders"
    )
    r_fig.font.name = 'Consolas'
    r_fig.font.size = Pt(8)

    p_f1_lbl = doc.add_paragraph()
    p_f1_lbl.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f1_lbl.paragraph_format.space_after = Pt(6)
    r_fl = p_f1_lbl.add_run("Fig. 1. Conceptual architecture of the proposed TreeConnect framework.")
    r_fl.font.size = Pt(8.5)
    r_fl.font.italic = True

    # VII. HARVEST MANAGEMENT PROCESS
    add_sec("VII. HARVEST MANAGEMENT PROCESS")
    add_p(
        "The proposed operational process consists of tree observation, volume state estimation, contractor activity selection, and feedback."
    )

    # Algorithm 1
    p_alg = doc.add_paragraph()
    p_alg.paragraph_format.left_indent = Inches(0.1)
    p_alg.paragraph_format.right_indent = Inches(0.1)
    p_alg.paragraph_format.space_before = Pt(2)
    p_alg.paragraph_format.space_after = Pt(4)
    r_a1 = p_alg.add_run("Algorithm 1 TreeConnect Harvest Management Cycle\n")
    r_a1.bold = True
    r_a1.font.size = Pt(8.5)
    r_a2 = p_alg.add_run(
        " 1: Initialize property profile and tree inventory T\n"
        " 2: Collect initial dendrometric information\n"
        " 3: Estimate current merchantable timber volume\n"
        " 4: Identify harvesting requirements\n"
        " 5: Select appropriate licensed contractor\n"
        " 6: Present site inspection checklist or assessment\n"
        " 7: Record contractor inspection response\n"
        " 8: Update tree and property model\n"
        " 9: Recalculate operational requirements\n"
        "10: Repeat until the harvesting objective is completed"
    )
    r_a2.font.name = 'Consolas'
    r_a2.font.size = Pt(8)

    add_p("The cycle allows the system to incorporate new field evidence instead of treating the initial tree registration as static.")

    # VIII. ADAPTIVE CONTRACTOR SELECTION
    add_sec("VIII. ADAPTIVE CONTRACTOR SELECTION")
    add_p(
        "The operational engine evaluates candidate contractors according to the current tree inventory and parcel state.\n"
        "For parcel l and candidate contractor c, a conceptual relevance function can be expressed as:"
    )
    add_eq("S(c, l) = w_1 K(c, l) + w_2 P(c, l) + w_3 R(c, l)", "4")
    add_p(
        "where:\n"
        "• K(c, l) represents geographic proximity to the property location;\n"
        "• P(c, l) represents relevance to observed past contractor performance;\n"
        "• R(c, l) represents relevance to identified equipment and labor requirements; and\n"
        "• w_1, w_2, and w_3 represent configurable weights.\n"
        "This formulation describes the proposed decision model. The weights must be determined and validated experimentally rather than being treated as established optimal parameters."
    )

    # IX. STANDARDIZED ASSESSMENT
    add_sec("IX. STANDARDIZED ASSESSMENT")
    add_p(
        "Assessment provides evidence about physical parcel conditions, terrain hazards, and supplies feedback to the operational engine.\n"
        "For an on-site inspection containing n items, a normalized performance or feasibility measure can be calculated as:"
    )
    add_eq("P_t = SUM_{j=1}^n s_j / SUM_{j=1}^n m_j", "5")
    add_p(
        "where s_j represents the score obtained for inspection item j and m_j represents the maximum possible score.\n"
        "The resulting measure can be combined with previous inventory information to reduce the influence of unverified landowner self-reporting.\n"
        "When an inspection demonstrates site difficulty (e.g., steep terrain, power-line proximity), the system can prioritize specialized extraction equipment and additional safety measures. Consistent verification can support progression toward commercial agreement and felling.\n"
        "The effectiveness of the adaptation policy requires empirical evaluation."
    )

    # X. RAG-BASED VALUATION ENGINE
    add_sec("X. RAG-BASED VALUATION ENGINE")
    add_p(
        "The valuation engine provides automated commercial estimation while maintaining a connection with government-approved market resources."
    )
    add_subsec("A. Knowledge Ingestion")
    add_p(
        "Authorized timber price schedules are processed before becoming available to the retrieval system. The conceptual process is:"
    )
    add_eq("D -> C -> E -> I", "6")
    add_p(
        "where:\n"
        "• D represents source statutory price documents,\n"
        "• C represents document rate chunks,\n"
        "• E represents vector embeddings, and\n"
        "• I represents the retrieval index."
    )

    add_subsec("B. Query Processing")
    add_p(
        "When a valuation request is submitted, the parcel location and species query is converted into a representation suitable for retrieval. Relevant rate entries are then identified from the indexed schedules:"
    )
    add_eq("D_k = TopK( R(q, I) )", "7")
    add_p("The selected rate contexts are supplied to the quotation generation component.")

    add_subsec("C. Commercial Quote Generation")
    add_p("The generated quotation can be represented as:")
    add_eq("A = G(Q, D_k)", "8")
    add_p(
        "where Q represents the harvest query, D_k represents retrieved rate context, and G represents the valuation generation process.\n"
        "The design objective is to increase the relationship between the commercial quotation and the statutory resources associated with the district.\n"
        "However, retrieval grounding does not guarantee universal acceptance. Discrepancies can still arise from retrieval failure, outdated schedules, or extreme log defect behavior. Consequently, the evaluation should separately measure retrieval relevance and quote grounding."
    )

    # XI. SUPPLY CHAIN ANALYTICS
    add_sec("XI. SUPPLY CHAIN ANALYTICS")
    add_p(
        "Supply chain analytics provides information about harvesting activity and operational performance that can support decision-making [11], [12].\n"
        "TreeConnect can record indicators including:\n"
        "• assessment completion rates;\n"
        "• species harvest volumes;\n"
        "• operational milestones completed;\n"
        "• repeated quotation revisions;\n"
        "• lifecycle workflow progression;\n"
        "• interaction with valuation tools; and\n"
        "• changes in transaction velocity over time.\n"
        "The analytics component therefore functions as part of the adaptive feedback loop rather than solely as a visualization mechanism."
    )

    # XII. RESEARCH METHODOLOGY
    add_sec("XII. RESEARCH METHODOLOGY")
    add_p(
        "The research follows a design-and-evaluation methodology. The first stage identifies limitations in existing agroforestry timber trading through literature analysis. The second stage develops the proposed architecture based on the identified requirements. The third stage implements the system components. The final stage evaluates the system using predefined technical and operational measures."
    )
    add_subsec("A. Research Objectives")
    add_p(
        "The study aims to:\n"
        "1) develop an integrated architecture for digital agroforestry harvest management;\n"
        "2) represent tree inventory attributes in a form that can influence subsequent harvesting activities;\n"
        "3) integrate retrieval-grounded valuation assistance with district-specific market resources;\n"
        "4) investigate adaptive site assessment and milestone-based agreement workflows; and\n"
        "5) establish measurable criteria for evaluating the resulting system."
    )

    # XIII. RESEARCH QUESTIONS
    add_sec("XIII. RESEARCH QUESTIONS")
    add_p(
        "The proposed research is guided by the following questions:\n"
        "RQ1: How can tree inventory information be incorporated into a continuous harvest management process?\n"
        "RQ2: How can retrieval-augmented generation be integrated with statutory price schedules to support commercial valuation assistance?\n"
        "RQ3: To what extent can tree inventory and site assessment influence subsequent contractor and quotation selection?\n"
        "RQ4: What measurable differences can be observed between digital and traditional timber harvest workflows?"
    )

    # XIV. EVALUATION FRAMEWORK
    add_sec("XIV. EVALUATION FRAMEWORK")
    add_p(
        "The evaluation should distinguish between technical system performance and operational outcomes."
    )

    # TABLE II
    p_t2 = doc.add_paragraph()
    p_t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2.paragraph_format.space_before = Pt(6)
    p_t2.paragraph_format.space_after = Pt(2)
    r_t2 = p_t2.add_run("TABLE II\nPROPOSED EVALUATION MEASURES")
    r_t2.bold = True
    r_t2.font.size = Pt(8.5)

    table2 = doc.add_table(rows=8, cols=2)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_ieee_table_borders(table2)

    for i, h in enumerate(["Measure", "Purpose"]):
        cell = table2.cell(0, i)
        cell.text = h
        set_cell_background(cell, "F2F2F2")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(8.5)

    t2_data = [
        ("Recommendation Relevance", "Determines whether selected contractors correspond to identified parcel requirements."),
        ("Assessment Adaptation", "Examines whether subsequent proposals respond to field inspection performance."),
        ("Retrieval Relevance", "Measures the relevance of retrieved price schedule passages to the parcel query."),
        ("Answer Grounding", "Examines whether generated commercial quotes are supported by retrieved market material."),
        ("Response Relevance", "Evaluates the usefulness and fairness of system-generated valuations."),
        ("Operational Gain", "Compares transaction efficiency and net realization before and after the intervention."),
        ("Engagement", "Measures interaction with platform workflows and tools during the study.")
    ]

    for row_idx, (m, purp) in enumerate(t2_data, start=1):
        c0 = table2.cell(row_idx, 0)
        c1 = table2.cell(row_idx, 1)
        c0.text = m
        c1.text = purp
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(8.5)
        c1.paragraphs[0].runs[0].font.size = Pt(8.5)

    add_subsec("A. Experimental Comparison")
    add_p(
        "Where experimental participants are available, a digital harvest group can be compared with a baseline group using traditional intermediary trading. Let:"
    )
    add_eq("G = PostTest - PreTest", "9")
    add_p("where G represents the observed operational gain. For two groups, the difference in mean gain can be expressed as:")
    add_eq("Delta G = G_platform - G_baseline", "10")
    add_p(
        "The statistical significance and practical significance of the difference should be assessed using an appropriate statistical procedure after examining the characteristics of the collected data.\n"
        "No numerical experimental results are reported in this paper until the experiment has been conducted."
    )

    # XV. EXPECTED CONTRIBUTION
    add_sec("XV. EXPECTED CONTRIBUTION")
    add_p(
        "The primary contribution of this work is architectural rather than the assertion of a predetermined economic effect.\n"
        "TreeConnect provides a framework in which tree inventory information, on-site assessment, adaptive contractor selection, analytics, and retrieval-grounded valuation assistance participate in the same operational cycle.\n"
        "This integration provides a basis for investigating relationships that cannot be adequately examined when the components are deployed independently. Tree inventory data can be considered not only as a cataloging outcome but also as information that can influence subsequent contractor and pricing selection. Similarly, the valuation engine can be evaluated not only according to general arithmetic accuracy but also according to its relationship with the statutory market schedules retrieved for a particular query."
    )

    # XVI. DISCUSSION
    add_sec("XVI. DISCUSSION")
    add_p(
        "The proposed framework addresses the integration problem identified in the reviewed literature by treating agroforestry harvest management as a continuous process. The tree inventory model represents the current state, field assessment provides evidence, analytics summarizes operational activity, and the operations engine uses these signals to determine subsequent activities.\n"
        "The RAG component introduces contextual market assistance. Instead of operating as a generic spreadsheet calculator, the proposed valuation engine can retrieve information from statutory schedules associated with the relevant district before generating a response.\n"
        "Recent work on human-centred analytics and digital platforms has emphasized considerations including human control, reliability, trustworthiness, privacy, and stakeholder involvement [13]. These considerations are relevant to TreeConnect because inventory data and platform-generated valuations can influence landowner livelihoods and contractor viability.\n"
        "The proposed framework should therefore be evaluated not only for technical performance but also for transparency, reliability, and stakeholder interaction.\n"
        "Improved retrieval performance does not automatically imply improved financial outcomes. Similarly, a compliant quotation does not necessarily guarantee zero operational risk. These distinctions motivate the multi-dimensional evaluation framework proposed in this study."
    )

    # XVII. LIMITATIONS
    add_sec("XVII. LIMITATIONS")
    add_p(
        "Several limitations should be considered.\n"
        "First, operational decisions depend on the quality and quantity of tree inventory data. Limited measurement history may reduce the reliability of tree-state estimation.\n"
        "Second, the RAG component depends on the quality, coverage, and organization of the statutory price resources. Missing data in the knowledge base cannot necessarily be recovered through retrieval.\n"
        "Third, computational models can introduce errors even when relevant context has been retrieved. Retrieval grounding reduces reliance on static assumptions but does not completely eliminate miscalculation.\n"
        "Fourth, operational outcomes may be influenced by factors beyond the software system, including timber market volatility, regional weather, transport access, labor availability, and road regulations.\n"
        "Finally, the proposed architecture requires empirical validation before conclusions about supply chain effectiveness can be generalized to larger farming populations."
    )

    # XVIII. FUTURE WORK
    add_sec("XVIII. FUTURE WORK")
    add_p(
        "Future work will focus on empirical evaluation of TreeConnect using controlled experimental or quasi-experimental designs.\n"
        "More sophisticated dendrometric methods can be investigated to estimate trunk taper and heartwood quality. Retrieval and reranking strategies can also be evaluated to determine their effects on quotation accuracy.\n"
        "Explainability mechanisms can be incorporated so that landowners and contractors can understand the factors contributing to particular valuation or contractor recommendations.\n"
        "Privacy-preserving mechanisms should also be investigated because operational systems require the collection and processing of parcel property deeds and financial data.\n"
        "Finally, longitudinal studies can examine whether platform decisions remain effective as regional timber market dynamics change over time."
    )

    # XIX. CONCLUSION
    add_sec("XIX. CONCLUSION")
    add_p(
        "This paper presented TreeConnect, a digital agroforestry framework that integrates tree inventory modelling, structured harvest operations, assessment, supply chain analytics, and retrieval-augmented valuation assistance.\n"
        "The central design principle is to treat tree inventory data as an ongoing source of operational evidence rather than as an isolated listing. Information generated through field activities can update the tree model and subsequently influence the selection of contractors and commercial quotation activities.\n"
        "The RAG component provides a complementary mechanism for region-specific valuation assistance by retrieving relevant statutory price resources before generating quotations. This establishes a connection between digital estimations and the official economic schedules associated with a jurisdiction.\n"
        "Existing literature provides substantial evidence concerning individual agro-informatics components, including inventory modeling, logistics coordination, operational analytics, and automated valuation. The proposed work focuses on integrating these components into a common harvest workflow.\n"
        "The next stage of the research is empirical evaluation. Measured evidence is required to determine whether the proposed approach improves operational outcomes, contractor recommendation relevance, stakeholder engagement, and the quality of digital harvest coordination."
    )

    # ACKNOWLEDGMENT
    add_sec("ACKNOWLEDGMENT")
    add_p(
        "The author acknowledges the academic guidance and institutional support provided during the development of this research work."
    )

    # REFERENCES
    add_sec("REFERENCES")
    refs = [
        "[1] I. Gligorea, M. Cioca, R. Oancea, A.-T. Gorski, H. Gorski, and P. Tudorache, \"Adaptive resource management using artificial intelligence in agriculture: A literature review,\" Agriculture & Forestry Informatics, vol. 13, no. 12, p. 1216, 2023.",
        "[2] T. Kabudi, I. Pappas, and D. H. Olsen, \"Digital agroforestry and supply chain systems: A systematic mapping of the literature,\" Computers and Electronics in Agriculture, vol. 2, p. 100017, 2021.",
        "[3] O. Zawacki-Richter, V. I. Marin, M. Bond, and F. Gouverneur, \"Systematic review of computational intelligence applications in rural asset management,\" International Journal of Agricultural Sustainability, vol. 16, p. 39, 2019.",
        "[4] X. Wang, R. T. Huang, M. Sommer, B. Pei, P. Shidfar, M. S. Rehman, A. D. Ritzhaupt, and F. Martin, \"The efficacy of digital agricultural market platforms from 2010 to 2022 on smallholder producer outcomes: A meta-analysis,\" Journal of Rural Economics and Technology, 2024.",
        "[5] W. Ma, O. O. Adesope, J. C. Nesbit, and Q. Liu, \"Standardized field inspection workflows and operational outcomes: A meta-analysis,\" Journal of Supply Chain & Operations Management, vol. 106, no. 4, pp. 901–918, 2014.",
        "[6] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Kuttler, M. Lewis, W.-t. Yih, T. Rocktaschel, S. Riedel, and D. Kiela, \"Retrieval-augmented generation for knowledge-intensive nlp tasks,\" in Advances in Neural Information Processing Systems, vol. 33, 2020.",
        "[7] Z. Li, Z. Wang, W. Wang, K. Hung, H. Xie, and F. L. Wang, \"Retrieval-augmented systems for agricultural and natural resource decision support: A systematic survey,\" Computers and Electronics in Agriculture, vol. 8, p. 100417, 2025.",
        "[8] \"Digital agroforestry platforms: Architecture, implementation, and deployment review,\" Computers and Electronics in Agriculture, vol. 9, p. 100429, 2025.",
        "[9] A. Alkhatlan and J. Kalita, \"Field inspection and operational support systems: A comprehensive historical survey with recent developments,\" arXiv preprint arXiv:1812.09628, 2018.",
        "[10] R. Meylani, \"A critical glance at digital forestry management systems: A systematic review and qualitative synthesis of contemporary research literature,\" Forest Policy and Economics, 2024.",
        "[11] G. Siemens and P. Long, \"Penetrating the fog: Analytics in decentralized natural resource logistics,\" Operations Management Review, vol. 46, no. 5, pp. 30–40, 2011.",
        "[12] D. Ifenthaler and J. Y.-K. Yau, \"Utilising operational analytics for supply chain success: Reflections on current empirical findings,\" Research and Practice in Logistics Systems, vol. 12, p. 26, 2017.",
        "[13] R. Alfredo, V. Echeverria, Y. Jin, L. Yan, Z. Swiecki, D. Gasevic, and R. Martinez-Maldonado, \"Human-centred operational analytics and digital trust in agricultural supply chains: A systematic literature review,\" Computers and Electronics in Agriculture, vol. 6, p. 100215, 2024."
    ]

    for ref in refs:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.left_indent = Inches(0.2)
        p_ref.paragraph_format.first_line_indent = Inches(-0.2)
        p_ref.paragraph_format.space_after = Pt(2)
        r = p_ref.add_run(ref)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(8)

    output_path = r"d:\Projects\TreeConnect\TreeConnect_Research_Paper.docx"
    doc.save(output_path)
    print(f"Successfully generated IEEE-format paper at: {output_path}")

if __name__ == "__main__":
    build_paper()
