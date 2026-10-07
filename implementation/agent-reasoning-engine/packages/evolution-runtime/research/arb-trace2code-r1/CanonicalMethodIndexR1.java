// Source-only AST projection. Open Questions: evidence/G01-CANONICAL-METHOD-INDEX-R1.json.
import com.sun.source.tree.*;
import com.sun.source.util.*;
import javax.tools.*;
import java.io.*;
import java.net.URI;
import java.nio.*;
import java.nio.charset.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;

public class CanonicalMethodIndexR1 {
    static String hash(byte[] bytes) throws Exception {
        StringBuilder result = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) result.append(String.format("%02x", b & 255));
        return result.toString();
    }
    static Map<String,Object> object(Object... pairs) {
        Map<String,Object> result = new LinkedHashMap<>();
        for (int i=0;i<pairs.length;i+=2) result.put((String)pairs[i], pairs[i+1]);
        return result;
    }
    static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        if (value instanceof Map) {
            List<String> rows = new ArrayList<>();
            for (Object raw : ((Map<?,?>)value).entrySet()) {
                Map.Entry<?,?> row = (Map.Entry<?,?>)raw;
                rows.add(json(row.getKey())+":"+json(row.getValue()));
            }
            return "{"+String.join(",",rows)+"}";
        }
        if (value instanceof Iterable) {
            List<String> rows = new ArrayList<>();
            for (Object item : (Iterable<?>)value) rows.add(json(item));
            return "["+String.join(",",rows)+"]";
        }
        StringBuilder result = new StringBuilder("\"");
        for (char c : value.toString().toCharArray()) {
            switch(c) {
                case '\"': result.append("\\\""); break;
                case '\\': result.append("\\\\"); break;
                case '\n': result.append("\\n"); break;
                case '\r': result.append("\\r"); break;
                case '\t': result.append("\\t"); break;
                default: if (c < 32) result.append(String.format("\\u%04x", (int)c)); else result.append(c);
            }
        }
        return result.append('"').toString();
    }
    static final class Source extends SimpleJavaFileObject {
        final String text;
        Source(Path path, String text) { super(path.toUri(), Kind.SOURCE); this.text=text; }
        public CharSequence getCharContent(boolean ignored) { return text; }
    }
    static final class Projection extends TreePathScanner<Void,Void> {
        final CompilationUnitTree unit;
        final SourcePositions positions;
        final String text,path;
        final int[] byteOffsets;
        final List<Map<String,Object>> classes=new ArrayList<>(),methods=new ArrayList<>(),calls=new ArrayList<>();
        final Deque<Map<String,Object>> owners=new ArrayDeque<>();
        String currentMethod=null;
        int lambdaDepth=0,unavailableSpans=0,unavailableDeclarationSpans=0,unavailableReferenceSpans=0;
        Projection(CompilationUnitTree unit, SourcePositions positions, String text, String path) {
            this.unit=unit; this.positions=positions; this.text=text; this.path=path;
            this.byteOffsets=new int[text.length()+1];
            int bytes=0;
            for (int i=0;i<text.length();) {
                int code=text.codePointAt(i), size=Character.charCount(code);
                if(size==2) byteOffsets[i+1]=-1;
                bytes+=code<=127?1:code<=2047?2:code<=65535?3:4;
                i+=size; byteOffsets[i]=bytes;
            }
        }
        int physicalLine(int offset) {
            int line=1;
            for(int i=0;i<offset;i++) {
                if(text.charAt(i)=='\r') { line++; if(i+1<offset&&text.charAt(i+1)=='\n')i++; }
                else if(text.charAt(i)=='\n')line++;
            }
            return line;
        }
        Map<String,Object> span(Tree tree, boolean includeSource) {
            return span(tree,includeSource,false);
        }
        Map<String,Object> span(Tree tree, boolean includeSource, boolean reference) {
            long start=positions.getStartPosition(unit,tree),end=positions.getEndPosition(unit,tree);
            if(start<0||end<start||end>text.length()||byteOffsets[(int)start]<0||byteOffsets[(int)end]<0) {
                unavailableSpans++;
                if(reference)unavailableReferenceSpans++;else unavailableDeclarationSpans++;
                return object("complete",false,"reason","compiler-source-position-unavailable");
            }
            String source=text.substring((int)start,(int)end);
            Map<String,Object> result=object("complete",true,"start_utf16",start,"end_utf16",end,
                "start_utf8",byteOffsets[(int)start],"end_utf8",byteOffsets[(int)end],
                "start_line",physicalLine((int)start),"end_line",physicalLine(Math.max((int)start,(int)end-1)));
            if(includeSource)result.put("source",source);
            return result;
        }
        String owner() { return owners.isEmpty()?null:(String)owners.peek().get("entity_id"); }
        String id(String kind,Map<String,Object> span) {
            return path+"#"+kind+"@"+(span.get("start_utf8")!=null?span.get("start_utf8"):"unavailable-"+unavailableSpans);
        }
        public Void visitClass(ClassTree tree,Void ignored) {
            Map<String,Object> span=span(tree,false);
            Map<String,Object> row=object("entity_id",id("class",span),"name",tree.getSimpleName().toString(),
                "kind",tree.getKind().toString(),"parent_class_id",owner(),"span",span);
            classes.add(row); owners.push(row);
            String old=currentMethod; int oldLambda=lambdaDepth;currentMethod=null;lambdaDepth=0;
            super.visitClass(tree,ignored);
            currentMethod=old;lambdaDepth=oldLambda;owners.pop();return null;
        }
        public Void visitMethod(MethodTree tree,Void ignored) {
            Map<String,Object> span=span(tree,true);
            String entity=id("method",span),old=currentMethod;
            List<String> parameters=new ArrayList<>();
            for(VariableTree parameter:tree.getParameters())parameters.add(parameter.getType().toString());
            methods.add(object("entity_id",entity,"owner_class_id",owner(),"name",tree.getName().toString(),
                "kind",tree.getReturnType()==null?"constructor":"method","has_body",tree.getBody()!=null,
                "parameter_types_syntax",parameters,"span",span));
            currentMethod=entity;super.visitMethod(tree,ignored);currentMethod=old;return null;
        }
        void call(Tree tree,String kind,String target,int arity) {
            Map<String,Object> sourceSpan=span(tree,true,true);
            calls.add(object("kind",kind,"enclosing_method_id",currentMethod,"owner_class_id",owner(),
                "inside_lambda",lambdaDepth>0,"target_syntax",target,"argument_count",arity,
                "resolution",Boolean.TRUE.equals(sourceSpan.get("complete"))?"unresolved-syntactic-reference":"unavailable-source-position",
                "span",sourceSpan));
        }
        public Void visitMethodInvocation(MethodInvocationTree tree,Void ignored) {
            call(tree,"invocation",tree.getMethodSelect().toString(),tree.getArguments().size());
            return super.visitMethodInvocation(tree,ignored);
        }
        public Void visitNewClass(NewClassTree tree,Void ignored) {
            call(tree,"constructor",tree.getIdentifier().toString(),tree.getArguments().size());
            return super.visitNewClass(tree,ignored);
        }
        public Void visitMemberReference(MemberReferenceTree tree,Void ignored) {
            call(tree,"member-reference",tree.getQualifierExpression().toString()+"::"+tree.getName(),-1);
            return super.visitMemberReference(tree,ignored);
        }
        public Void visitLambdaExpression(LambdaExpressionTree tree,Void ignored) {
            lambdaDepth++;super.visitLambdaExpression(tree,ignored);lambdaDepth--;return null;
        }
    }
    static Map<String,Object> parse(Path root,String relative) throws Exception {
        Path file=root.resolve(relative).normalize();
        if(!file.startsWith(root)||Files.isSymbolicLink(file)||!file.toRealPath().startsWith(root))throw new IOException("source-path-scope");
        byte[] bytes=Files.readAllBytes(file);
        Map<String,Object> result=object("path",relative,"source_sha256",hash(bytes),"source_bytes",bytes.length);
        String text;
        try { text=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString(); }
        catch(CharacterCodingException exception) { result.put("status","invalid-utf8");return result; }
        JavaCompiler compiler=ToolProvider.getSystemJavaCompiler();
        if(compiler==null)throw new IOException("jdk-compiler-missing");
        DiagnosticCollector<JavaFileObject> diagnostics=new DiagnosticCollector<>();
        try(StandardJavaFileManager manager=compiler.getStandardFileManager(diagnostics,Locale.ROOT,StandardCharsets.UTF_8)) {
            JavacTask task=(JavacTask)compiler.getTask(null,manager,diagnostics,
                Arrays.asList("-proc:none","-encoding","UTF-8","-classpath","","-sourcepath",""),null,
                Arrays.asList(new Source(file,text)));
            CompilationUnitTree unit=task.parse().iterator().next(); // Never analyze, generate or call.
            Projection projection=new Projection(unit,Trees.instance(task).getSourcePositions(),text,relative);
            projection.scan(unit,null);
            List<Map<String,Object>> errors=new ArrayList<>();
            for(Diagnostic<? extends JavaFileObject> diagnostic:diagnostics.getDiagnostics())
                if(diagnostic.getKind()==Diagnostic.Kind.ERROR)errors.add(object("code",diagnostic.getCode(),"position",diagnostic.getPosition()));
            result.put("status",errors.isEmpty()&&projection.unavailableDeclarationSpans==0?"parsed":"parse-or-span-unqualified");
            result.put("package_syntax",unit.getPackageName()==null?"":unit.getPackageName().toString());
            result.put("classes",projection.classes);result.put("methods",projection.methods);result.put("calls",projection.calls);
            result.put("errors",errors);result.put("unavailable_spans",projection.unavailableSpans);
            result.put("unavailable_declaration_spans",projection.unavailableDeclarationSpans);
            result.put("unavailable_reference_spans",projection.unavailableReferenceSpans);
            List<String> imports=new ArrayList<>();for(ImportTree item:unit.getImports())imports.add(item.toString().trim());
            result.put("imports_syntax",imports);
        }
        return result;
    }
    public static void main(String[] args) throws Exception {
        if(args.length!=1)throw new IllegalArgumentException("exact-corpus-root-required");
        Path root=Path.of(args[0]).toRealPath();
        BufferedReader input=new BufferedReader(new InputStreamReader(System.in,StandardCharsets.UTF_8));
        String relative;
        while((relative=input.readLine())!=null) {
            Map<String,Object> row;
            try { row=parse(root,relative); }
            catch(Exception exception) { row=object("path",relative,"status","parser-failed","failure_code",exception.getClass().getSimpleName()); }
            System.out.println(json(row));
        }
    }
}
