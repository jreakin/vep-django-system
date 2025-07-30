from typing import Tuple, Dict, List
from .models import VoterRecord


def construct_address_lines(voter: VoterRecord) -> Tuple[str, str]:
    """
    Construct full address lines from residence and mailing address components.
    Returns (residence_full, mailing_full) as tuple.
    """
    # Construct residence address
    res_components = [
        voter.residence_part_house_number or "",
        voter.residence_part_house_direction or "",
        voter.residence_part_street_name or "",
        voter.residence_part_street_type or ""
    ]
    res_address = " ".join(filter(None, res_components)).strip()
    
    # Add unit information if available
    if voter.residence_part_unit_number and voter.residence_part_unit_type:
        res_address += f" {voter.residence_part_unit_type} {voter.residence_part_unit_number}"
    
    # Add street suffix if available
    if voter.residence_part_street_suffix:
        res_address += f", {voter.residence_part_street_suffix}"
    
    # Construct city, state, zip
    res_city_state_zip = f"{voter.residence_part_city or ''}, {voter.residence_part_state or ''} {voter.residence_part_zip5 or ''}".strip().strip(",")
    
    # Construct mailing address
    mail_address = f"{voter.mail_address1 or ''} {voter.mail_address2 or ''}".strip()
    mail_city_state_zip = f"{voter.mail_city or ''}, {voter.mail_state or ''} {voter.mail_zip5 or ''}".strip().strip(",")
    
    # Return full addresses
    residence_full = f"{res_address}\n{res_city_state_zip}" if res_city_state_zip else res_address
    mailing_full = f"{mail_address}\n{mail_city_state_zip}" if mail_city_state_zip else mail_address
    
    return residence_full, mailing_full


def update_addresses(voter: VoterRecord):
    """Update the residential_address and mailing_address fields from components."""
    residence_full, mailing_full = construct_address_lines(voter)
    
    voter.residential_address = residence_full
    voter.mailing_address = mailing_full
    voter.save()


def get_field_mappings() -> Dict[str, List[str]]:
    """
    Get the comprehensive field mappings for CSV import.
    Returns a dictionary mapping model fields to their possible CSV column aliases.
    """
    return {
        # Voter Identification
        'voter_vuid': ["SOS_VOTERID", "VUIDNO", "VUID", "VOTER REG NUMBER", "VTRID"],
        'voter_registration_date': ["REGISTRATION_DATE", "EDR", "EDRDAT", "REGISTRATIONDATE", "VOTE_ELIGIBLE_DATE"],
        'voter_registration_status': ["STATUS", "VOTER STATUS", "VOTER_STATUS"],
        'voter_registration_status_reason': ["VOTER STATUS REASON", "VOTER_STATUS_REASON"],
        'voter_precinct_number': ["PRECINCT_CODE", "PCT", "PREC_CODE"],
        'voter_precinct_name': ["PCTNAME", "PRECINCT", "PRECINCT_NAME"],
        'voter_absentee': ["ABSENTEE"],
        'voter_precinct_code': ["PCTCOD"],
        'voter_precinct_split': ["PCTSPT"],
        'voter_registration_application_source': ["APPLICATION SOURCE"],
        'voter_registration_permanent_absentee': ["IS PERMANENT ABSENTEE"],
        'voter_registration_type': ["VOTER TYPE"],
        'voter_political_party': ["PARTY_AFFILIATION"],
        'file_origin': ["FILE_ORIGIN"],
        
        # Personal Information
        'person_name_first': ["FSTNAM", "FIRST_NAME", "FNAME", "FIRSTNAME"],
        'person_name_middle': ["MIDDLENAME", "MNAME", "MIDDLE_NAME", "MIDNAM"],
        'person_name_last': ["LAST_NAME", "LASTNAME", "LNAME", "LSTNAM"],
        'person_name_prefix': ["NAMPFX"],
        'person_name_suffix': ["SFX", "SUFFIX"],
        'person_dob': ["DOB", "DATE_OF_BIRTH"],
        'person_gender': ["GENDER", "SEX"],
        
        # Residence Address
        'residence_standardized': ["RESIDENCEADDRESS"],
        'residence_part_house_number': ["RA_HS_NUM", "HOUSENUMBER", "RHNUM"],
        'residence_part_house_direction': ["RA_STDIR_CODE", "STRPRE", "RDESIG"],
        'residence_part_street_name': ["RA_STREET_NAME", "RSTNAME", "STRNAM", "STREETNAME"],
        'residence_part_street_type': ["STRTYP", "RA_STTYPE", "RSTTYPE"],
        'residence_part_street_suffix': ["RA_STDIR_CODE_POST", "RSTSFX"],
        'residence_part_unit_number': ["RA_UNIT_NUM", "UNITNO", "RUNUM", "UNITNUMBER"],
        'residence_part_unit_type': ["UNITYP", "RA_UTYP_CODE", "RUTYPE", "UNITTYPE"],
        'residence_part_city': ["RCITY", "RSCITY", "RA_CITY", "RESIDENTIAL_CITY", "ADDRESSCITY"],
        'residence_part_state': ["RA_STATE", "RSTATE", "RESIDENTIAL_STATE", "ADDRESSSTATE"],
        'residence_part_zip5': ["RA_ZIP_CODE", "RZIP", "RZIPCD", "RESIDENTIAL_ZIP", "ADDRESSZIP"],
        'residence_part_zip4': ["RZIP+4", "RESIDENTIAL_ZIP_PLUS4"],
        'residence_address1': ["RESIDENTIAL_ADDRESS1", "ADDRESS1"],
        'residence_address2': ["ADDRESS2", "RESIDENTIAL_SECONDARY_ADDR"],
        'residence_country': ["RESIDENTIAL_COUNTRY"],
        'residence_postal_code': ["RESIDENTIAL_POSTALCODE"],
        'residence_address_id': ["ADDRID"],
        'residence_effective_date': ["REFDAT"],
        
        # Mailing Address
        'mail_address1': ["MAILINGADDRESS1", "MLADD1", "MADR1", "MA_ADDR_LINE_1", "MAILING_ADDRESS1"],
        'mail_address2': ["MAILINGADDRESS2", "MAILING_SECONDARY_ADDRESS", "MADR2", "MLADD2"],
        'mail_city': ["MLCITY", "MAILINGCITYSTATEZIP", "MAILING_CITY", "MCITY", "MA_CITY"],
        'mail_state': ["MST", "MA_STATE", "MLSTAT", "MAILING_STATE"],
        'mail_zip5': ["MAILING_ZIP", "MZIP", "MLZIPCD", "MA_ZIP_CODE"],
        'mail_zip4': ["MA_ZIP_PLUS", "MZIP+4", "MAILING_ZIP_PLUS4"],
        'mail_country': ["MAILING_COUNTRY", "MLCTRY"],
        'mail_postal_code': ["MAILING_POSTAL_CODE"],
        'mail_change_date': ["MCHGDT"],
        'mail_standardized': ["MAILINGADDRESS"],
        
        # Contact Information
        'contact_phone_unknown1': ["PHONENUMBER", "PHONE_NO"],
        
        # District Information
        'district_city_limits': ["CITY_LIMITS"],
        'district_county_number': ["COUNTY_NUMBER", "CURRENT_COUNTY"],
        'district_county_ward': ["WARD", "ward"],
        'district_state_legislative_lower': ["DIST03", "HOUSE_DISTRICT", "NEWHD", "STATE_REPRESENTATIVE_DISTRICT"],
        'district_state_legislative_upper': ["SENATE_DISTRICT", "DIST02", "NEWSD", "STATE_SENATE_DISTRICT"],
        'district_federal_congressional': ["NEWCD", "CONGRESSIONAL", "DIST01", "CONGRESS_DISTRICT", "CONGRESSIONAL_DISTRICT"],
        'district_county_commissioner_precinct': ["DIST04"],
        'district_city_municipality': ["DIST05", "MUNICIPALITY"],
        'district_county_constable_precinct': ["DIST06"],
        'district_county_school_district': ["DIST07"],
        'district_county_sub_school_district': ["DIST08"],
        'district_county_water_district_01': ["DIST11"],
        'district_county_mass_transit_authority': ["DIST12"],
        'district_county_water_district_02': ["DIST13"],
        'district_state_board_of_education': ["STATE_BOARD_OF_EDUCATION", "DIST16"],
        'district_county_community_college': ["DIST18"],
        'district_city_council_district': ["DIST19"],
        'district_court_municipal': ["MUNICIPAL_COURT_DISTRICT"],
        'district_court_county': ["COUNTY_COURT_DISTRICT"],
        'district_court_appeallate': ["COURT_OF_APPEALS"],
        'district_city_name': ["CITY"],
        'district_city_school_district': ["CITY_SCHOOL_DISTRICT"],
        'district_county_id': ["COUNTY_ID"],
        'district_county_township': ["TOWNSHIP"],
        'district_county_village': ["VILLAGE"],
        'district_county_local_school_district': ["LOCAL_SCHOOL_DISTRICT"],
        'district_county_library_district': ["LIBRARY"],
        'district_county_career_center': ["CAREER_CENTER"],
        'district_county_education_service_center': ["EDU_SERVICE_CENTER_DISTRICT"],
        'district_county_exempted_village_school_district': ["EXEMPTED_VILL_SCHOOL_DISTRICT"],
        'district_state_juristidction': ["JURISDICTION"],
        'district_state_district_combo': ["DISTRICTCOMBO"],
        'district_state_upper': ["STATE SENATE"],
        'district_state_lower': ["STATE ASSEMBLY"],
        'district_state_court_of_appeals': ["COURT OF APPEALS"],
        'district_state_multijurisdictional_judge': ["MULTI-JURISDICTIONAL JUDGE"],
        'district_county_name': ["COUNTY"],
        'district_county_supervisory': ["COUNTY SUPERVISORY"],
        'district_county_school': ["SCHOOL"],
        'district_county_sanitary': ["SANITARY"],
        'district_county_technical_college': ["TECHNICAL COLLEGE"],
        'district_county_representational_school': ["REPRESENTATIONAL SCHOOL"],
        'district_state': ["STATE"],
        'district_county_district_attorney': ["DISTRICT ATTORNEY"],
        'district_state_circuit_court': ["CIRCUIT COURT"],
        'district_county_first_class_school': ["FIRST CLASS SCHOOL"],
        'district_city_incorporation': ["INCORPORATION"],
        'voter_county': ["COUNTY"],
    }


def get_office_type_mappings() -> Dict[str, Dict[str, List[str]]]:
    """
    Get office type mappings based on district levels.
    Returns a nested dictionary: district_level -> category -> office_types
    """
    return {
        'federal': {
            'executive': ["President", "Vice President"],
            'legislative': ["U.S. Senator", "U.S. Representative", "Delegate to House of Representatives", "Resident Commissioner"]
        },
        'state': {
            'executive': ["Governor", "Lieutenant Governor", "Secretary of State", "Attorney General", "State Auditor", "State Comptroller", "State Controller", "State Treasurer", "Commissioner of Agriculture", "Commissioner of Insurance", "Commissioner of General Land Office"],
            'legislative': ["State Senator", "State Representative", "State Assemblymember"],
            'judicial': ["State Supreme Court Chief Justice", "State Supreme Court Justice", "Court of Criminal Appeals Judge", "Court of Appeals Judge", "District Judge", "County Court Judge", "Justice of the Peace", "Municipal Judge"],
            'regulatory': ["Public Utilities Commissioner", "Railroad Commissioner", "State Board of Education Member"]
        },
        'county': {
            'executive': ["County Judge", "County Executive", "County Commissioner", "County Supervisor", "County Manager"],
            'law_enforcement': ["Sheriff", "Constable"],
            'judicial': ["County Judge", "District Judge", "Justice of the Peace", "Magistrate"],
            'administrative': ["County Clerk", "District Clerk", "County/District Clerk"],
            'financial': ["County Treasurer", "Tax Assessor-Collector", "County Auditor"],
            'legal': ["District Attorney", "County Attorney", "Criminal District Attorney"],
            'public_safety': ["Coroner", "Fire Chief"],
            'other': ["County Surveyor", "County Recorder", "Recorder of Deeds", "County Assessor", "Elections Administrator"]
        },
        'city': {
            'executive': ["Mayor", "City Manager"],
            'legislative': ["City Council Member", "Alderman", "Council Member At Large", "Council Member by District", "Council Member by Ward"],
            'administrative': ["City Clerk", "City Treasurer", "City Attorney"],
            'other': ["Municipal Judge", "Mayor Pro Tempore"]
        },
        'local': {
            'new_england_town': ["Selectman", "Board of Selectmen Member", "Town Clerk", "Town Treasurer", "Town Moderator"],
            'township': ["Township Supervisor", "Township Clerk", "Township Treasurer", "Township Trustee"],
            'other': ["Village President", "Village Trustee", "Town Council Member"]
        },
        'special_district': {
            'school_district': ["School Board Member", "School Board Trustee", "School Board President", "School Board Secretary"],
            'special_purpose_districts': ["Special District Director", "Special District Board Member", "Fire District Commissioner", "Water District Board Member", "Library District Trustee", "Hospital District Board Member", "Transportation District Board Member", "Cemetery District Trustee", "Park and Recreation District Board Member", "Irrigation District Director", "Conservation District Supervisor"]
        }
    }


def validate_office_type(district_level: str, office_type: str) -> bool:
    """
    Validate if an office type is valid for the given district level.
    """
    mappings = get_office_type_mappings()
    
    if district_level not in mappings:
        return False
    
    # Check all categories for this district level
    for category, office_types in mappings[district_level].items():
        if office_type in office_types:
            return True
    
    return False


def get_valid_office_types_for_district(district_level: str) -> List[str]:
    """
    Get all valid office types for a given district level.
    """
    mappings = get_office_type_mappings()
    
    if district_level not in mappings:
        return []
    
    valid_types = []
    for category, office_types in mappings[district_level].items():
        valid_types.extend(office_types)
    
    return valid_types