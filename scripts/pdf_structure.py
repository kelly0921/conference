"""Add semantic structure to the workbook's explicitly marked content.
No PDF/UA certification is asserted; assistive-technology review remains required.
"""
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject, BooleanObject, DictionaryObject, NameObject, NumberObject,
    TextStringObject,
)

def tag_document(path, records):
    reader = PdfReader(path)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.pdf_header = b"%PDF-1.7"
    root = DictionaryObject({NameObject("/Type"): NameObject("/StructTreeRoot")})
    root_ref = writer._add_object(root)
    document = DictionaryObject({NameObject("/Type"): NameObject("/StructElem"),
        NameObject("/S"): NameObject("/Document"), NameObject("/P"): root_ref})
    document_ref = writer._add_object(document)
    root[NameObject("/K")] = document_ref
    sections, nums = ArrayObject(), ArrayObject()
    annotation_key = len(writer.pages)
    for page_index, (page, items) in enumerate(zip(writer.pages, records)):
        page_ref = page.indirect_reference
        page[NameObject("/StructParents")] = NumberObject(page_index)
        page[NameObject("/Tabs")] = NameObject("/S")
        section = DictionaryObject({NameObject("/Type"): NameObject("/StructElem"),
            NameObject("/S"): NameObject("/Sect"), NameObject("/P"): document_ref,
            NameObject("/Pg"): page_ref})
        section_ref = writer._add_object(section)
        sections.append(section_ref)
        children, parents, links = ArrayObject(), ArrayObject(), []
        for mcid, role in enumerate(items):
            elem = DictionaryObject({NameObject("/Type"): NameObject("/StructElem"),
                NameObject("/S"): NameObject("/"+role), NameObject("/P"): section_ref,
                NameObject("/Pg"): page_ref, NameObject("/K"): NumberObject(mcid)})
            elem_ref = writer._add_object(elem)
            children.append(elem_ref)
            parents.append(elem_ref)
            if role == "Link":
                links.append((elem, elem_ref, mcid))
        annotations = [a for a in page.get("/Annots", []) if a.get_object().get("/Subtype") == "/Link"]
        # Each inline source paragraph creates exactly one source annotation.
        if len(annotations) != len(links):
            raise ValueError(f"Page {page_index+1}: source link structure mismatch")
        for annotation_ref, (elem, elem_ref, mcid) in zip(annotations, links):
            annotation = annotation_ref.get_object()
            annotation[NameObject("/StructParent")] = NumberObject(annotation_key)
            annotation[NameObject("/Contents")] = TextStringObject(
                "Open source: " + str(annotation.get("/A", {}).get("/URI", "")))
            objr = DictionaryObject({NameObject("/Type"): NameObject("/OBJR"),
                NameObject("/Obj"): annotation_ref, NameObject("/Pg"): page_ref})
            elem[NameObject("/K")] = ArrayObject([NumberObject(mcid), objr])
            nums.extend([NumberObject(annotation_key), elem_ref])
            annotation_key += 1
        section[NameObject("/K")] = children
        nums.extend([NumberObject(page_index), parents])
    document[NameObject("/K")] = sections
    # Number-tree keys must be sorted, including keys for link annotations.
    pairs = sorted([(int(nums[i]), nums[i+1]) for i in range(0,len(nums),2)])
    parent_tree = DictionaryObject({NameObject("/Nums"): ArrayObject(
        [value for key, value in pairs for value in (NumberObject(key),value)])})
    root[NameObject("/ParentTree")] = writer._add_object(parent_tree)
    root[NameObject("/ParentTreeNextKey")] = NumberObject(annotation_key)
    writer.root_object[NameObject("/StructTreeRoot")] = root_ref
    writer.root_object[NameObject("/MarkInfo")] = DictionaryObject(
        {NameObject("/Marked"): BooleanObject(True)})
    writer.root_object[NameObject("/Lang")] = TextStringObject("en-US")
    writer.root_object[NameObject("/ViewerPreferences")] = DictionaryObject(
        {NameObject("/DisplayDocTitle"): BooleanObject(True)})
    with open(path, "wb") as output:
        writer.write(output)
